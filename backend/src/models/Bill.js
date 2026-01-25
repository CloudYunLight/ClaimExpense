const DatabaseUtil = require('../utils/database');

const Bill = {
  // 添加账单

  create: async (billData) => {
    const { listId, paymentMethod, amount, payerId, remark } = billData;

    try {
      // 检查过去3小时内是否已有相同的账单数据
      const checkDuplicateQuery = `
        SELECT bill_id 
        FROM bills 
        WHERE list_id = ? 
          AND payment_method = ? 
          AND amount = ? 
          AND payer_id = ? 
          AND remark = ? 
          AND create_time >= DATE_SUB(NOW(), INTERVAL 3 HOUR)`;
          
      const duplicateResults = await DatabaseUtil.execute(checkDuplicateQuery, [
        listId, 
        paymentMethod, 
        amount, 
        payerId, 
        remark || '' // 使用空字符串处理可能的null值
      ]);

      if (duplicateResults.length > 0) {
        
        throw new Error('3小时内已存在相同的账单数据');
      }

      // 插入账单记录
      const insertBillQuery = `INSERT INTO bills (list_id, payment_method, amount, payer_id, remark) VALUES (?, ?, ?, ?, ?)`;
      const billResult = await DatabaseUtil.execute(insertBillQuery, [listId, paymentMethod, amount, payerId, remark]);

      // 更新清单总金额
      const updateListAmountQuery = `
        UPDATE reimbursement_lists 
        SET total_amount = (
          SELECT COALESCE(SUM(amount), 0) 
          FROM bills 
          WHERE list_id = ?
        ) 
        WHERE list_id = ?`;
      await DatabaseUtil.execute(updateListAmountQuery, [listId, listId]);

      return { billId: billResult.insertId };
    } catch (error) {
      throw error;
    }
  },

  // 根据清单ID获取账单列表
  getByListId: async (listId) => {
    const query = `SELECT 
      bill_id as billId,
      list_id as listId,
      payment_method as paymentMethod,
      amount,
      payer_id as payerId,
      create_time as createTime,
      remark
    FROM bills 
    WHERE list_id = ? 
    ORDER BY create_time DESC`;

    const [rows] = await DatabaseUtil.execute(query, [listId]);
    return rows;
  },

  // 根据支付人ID获取账单列表
  getByPayerId: async (payerId, pageNum = 1, pageSize = 10, filters = {}) => {
    const { listId, paymentMethod, startTime, endTime } = filters;
    const offset = (pageNum - 1) * pageSize;

    let query = `SELECT 
      b.bill_id as billId,
      b.list_id as listId,
      rl.activity_name as activityName,
      b.payment_method as paymentMethod,
      CASE b.payment_method
        WHEN 0 THEN '微信'
        WHEN 1 THEN '支付宝'
        WHEN 2 THEN '现金'
        WHEN 3 THEN '需要转交'
        ELSE '未知'
      END as paymentMethodText,
      b.amount,
      b.payer_id as payerId,
      u.real_name as payerName,
      b.remark,
      b.create_time as createTime
    FROM bills b
    JOIN reimbursement_lists rl ON b.list_id = rl.list_id
    JOIN users u ON b.payer_id = u.user_id
    WHERE b.payer_id = ?`;
    let params = [payerId];

    if (listId) {
      query += ' AND b.list_id = ?';
      params.push(listId);
    }

    if (paymentMethod !== undefined && paymentMethod !== null) {
      query += ' AND b.payment_method = ?';
      params.push(paymentMethod);
    }

    if (startTime) {
      query += ' AND b.create_time >= ?';
      params.push(startTime);
    }

    if (endTime) {
      query += ' AND b.create_time <= ?';
      params.push(endTime);
    }

    query += ' ORDER BY b.create_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));

    const countQuery = `SELECT COUNT(*) as total FROM bills b WHERE payer_id = ?`;
    const countParams = [payerId];

    if (listId) {
      countQuery += ' AND list_id = ?';
      countParams.push(listId);
    }

    if (paymentMethod !== undefined && paymentMethod !== null) {
      countQuery += ' AND payment_method = ?';
      countParams.push(paymentMethod);
    }

    if (startTime) {
      countQuery += ' AND create_time >= ?';
      countParams.push(startTime);
    }

    if (endTime) {
      countQuery += ' AND create_time <= ?';
      countParams.push(endTime);
    }

    const countResult = await DatabaseUtil.execute(countQuery, countParams);
    const rows = await DatabaseUtil.execute(query, params);

    return {
      total: countResult[0].total,
      pageNum: parseInt(pageNum),
      pageSize: parseInt(pageSize),
      records: rows
    };
  },

  // 更新账单
  updateById: async (billId, userId, billData) => {
    const { paymentMethod, amount, remark } = billData;

    // 首先检查账单是否存在且属于当前用户
    const checkQuery = `SELECT b.*, rl.creator_id 
                        FROM bills b 
                        JOIN reimbursement_lists rl ON b.list_id = rl.list_id 
                        WHERE b.bill_id = ? AND b.payer_id = ?`;
    const checkRows = await DatabaseUtil.execute(checkQuery, [billId, userId]);

    if (!checkRows.length) {
      return { success: false, message: '账单不存在或不属于当前用户' };
    }

    try {
      // 更新账单
      const updateBillQuery = `UPDATE bills 
                               SET payment_method = ?, amount = ?, remark = ? ,update_time = NOW()
                               WHERE bill_id = ? AND payer_id = ?`;
      await DatabaseUtil.execute(updateBillQuery, [paymentMethod, amount, remark, billId, userId]);

      // 重新计算并更新清单总金额
      const updateListAmountQuery = `
        UPDATE reimbursement_lists 
        SET total_amount = (
          SELECT COALESCE(SUM(amount), 0) 
          FROM bills 
          WHERE list_id = ?
        ) 
        WHERE list_id = ?`;
      await DatabaseUtil.execute(updateListAmountQuery, [checkRows[0].list_id, checkRows[0].list_id]);

      return { success: true, message: '账单更新成功' };
    } catch (error) {
      throw error;
    }
  },

  // 删除账单
  deleteById: async (billId, userId) => {
    // 首先获取账单信息
    const checkQuery = `SELECT b.*, rl.creator_id 
                        FROM bills b 
                        JOIN reimbursement_lists rl ON b.list_id = rl.list_id 
                        WHERE b.bill_id = ? AND b.payer_id = ?`;
    const checkRows = await DatabaseUtil.execute(checkQuery, [billId, userId]);

    if (!checkRows.length) {
      return { success: false, message: '账单不存在或不属于当前用户' };
    }

    try {
      // 删除账单
      const deleteBillQuery = 'DELETE FROM bills WHERE bill_id = ? AND payer_id = ?';
      const result = await DatabaseUtil.execute(deleteBillQuery, [billId, userId]);

      // 重新计算并更新清单总金额
      const updateListAmountQuery = `
        UPDATE reimbursement_lists 
        SET total_amount = (
          SELECT COALESCE(SUM(amount), 0) 
          FROM bills 
          WHERE list_id = ?
        ) 
        WHERE list_id = ?`;
      await DatabaseUtil.execute(updateListAmountQuery, [checkRows[0].list_id, checkRows[0].list_id]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Bill;