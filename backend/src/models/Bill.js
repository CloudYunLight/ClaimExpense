const db = require('./index');

const Bill = {
  // 添加账单
  create: async (billData) => {
    const { listId, paymentMethod, amount, payerId, remark } = billData;
    
    // 开始事务
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // 插入账单记录
      const insertBillQuery = `INSERT INTO bills (list_id, payment_method, amount, payer_id, remark) VALUES (?, ?, ?, ?, ?)`;
      const [billResult] = await connection.execute(insertBillQuery, [listId, paymentMethod, amount, payerId, remark]);
      
      // 更新清单总金额
      const updateListAmountQuery = `
        UPDATE reimbursement_lists 
        SET total_amount = (
          SELECT COALESCE(SUM(amount), 0) 
          FROM bills 
          WHERE list_id = ?
        ) 
        WHERE list_id = ?`;
      await connection.execute(updateListAmountQuery, [listId, listId]);
      
      await connection.commit();
      
      return { billId: billResult.insertId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
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
    
    const [rows] = await db.execute(query, [listId]);
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
    const params = [payerId];
    
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
    
    const [countResult] = await db.execute(countQuery, countParams);
    const [rows] = await db.execute(query, params);
    
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
    const [checkRows] = await db.execute(checkQuery, [billId, userId]);
    
    if (!checkRows.length) {
      return { success: false, message: '账单不存在或不属于当前用户' };
    }
    
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // 更新账单
      const updateBillQuery = `UPDATE bills 
                               SET payment_method = ?, amount = ?, remark = ? 
                               WHERE bill_id = ? AND payer_id = ?`;
      await connection.execute(updateBillQuery, [paymentMethod, amount, remark, billId, userId]);
      
      // 重新计算并更新清单总金额
      const updateListAmountQuery = `
        UPDATE reimbursement_lists 
        SET total_amount = (
          SELECT COALESCE(SUM(amount), 0) 
          FROM bills 
          WHERE list_id = ?
        ) 
        WHERE list_id = ?`;
      await connection.execute(updateListAmountQuery, [checkRows[0].list_id, checkRows[0].list_id]);
      
      await connection.commit();
      return { success: true, message: '账单更新成功' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // 删除账单
  deleteById: async (billId, userId) => {
    // 首先获取账单信息
    const checkQuery = `SELECT b.*, rl.creator_id 
                        FROM bills b 
                        JOIN reimbursement_lists rl ON b.list_id = rl.list_id 
                        WHERE b.bill_id = ? AND b.payer_id = ?`;
    const [checkRows] = await db.execute(checkQuery, [billId, userId]);
    
    if (!checkRows.length) {
      return { success: false, message: '账单不存在或不属于当前用户' };
    }
    
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // 删除账单
      const deleteBillQuery = 'DELETE FROM bills WHERE bill_id = ? AND payer_id = ?';
      const [result] = await connection.execute(deleteBillQuery, [billId, userId]);
      
      // 重新计算并更新清单总金额
      const updateListAmountQuery = `
        UPDATE reimbursement_lists 
        SET total_amount = (
          SELECT COALESCE(SUM(amount), 0) 
          FROM bills 
          WHERE list_id = ?
        ) 
        WHERE list_id = ?`;
      await connection.execute(updateListAmountQuery, [checkRows[0].list_id, checkRows[0].list_id]);
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = Bill;