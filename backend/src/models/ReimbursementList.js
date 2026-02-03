const DatabaseUtil = require('../utils/database');
const { normalizeStatusFilter } = require('../utils/utils_status');

const ReimbursementList = {
  // 根据活动名称和创建者ID查询清单（用于实现幂等性）
  getByActivityNameAndCreator: async (activityName, creatorId) => {
    const query = `SELECT 
      list_id as listId, 
      activity_name as activityName, 
      status, 
      create_time as createTime, 
      update_time as updateTime 
    FROM reimbursement_lists 
    WHERE activity_name = ? AND creator_id = ? 
    AND create_time >= DATE_SUB(NOW(), INTERVAL 3 HOUR)`;

    const rows = await DatabaseUtil.execute(query, [activityName, creatorId]);
    return rows[0] || null;
  },

  // 创建报销清单
  create: async (listData) => {
    const { activityName, creatorId } = listData;
    const query = 'INSERT INTO reimbursement_lists (activity_name, creator_id, total_amount, status) VALUES (?, ?, 0, 0)';

    const result = await DatabaseUtil.execute(query, [activityName, creatorId]);
    return { listId: result.insertId };
  },

  // 根据创建者ID获取清单列表
  getByCreatorId: async (creatorId, pageNum = 1, pageSize = 10, filters = {}) => {
    const { activityName, status, startTime, endTime } = filters;
    const offset = (pageNum - 1) * pageSize;

    let query = `SELECT 
      list_id as listId, 
      activity_name as activityName, 
      total_amount as totalAmount, 
      status, 
      create_time as createTime, 
      update_time as updateTime 
    FROM reimbursement_lists 
    WHERE creator_id = ?`;
    let params = [creatorId];

    if (activityName) {
      query += ' AND activity_name LIKE ?';
      params.push(`%${activityName}%`);
    }

    const normalizedStatus = normalizeStatusFilter(status);
    if (normalizedStatus !== undefined) {
      query += ' AND status = ?';
      params.push(normalizedStatus);
    }

    if (startTime) {
      query += ' AND create_time >= ?';
      params.push(startTime);
    }

    if (endTime) {
      query += ' AND create_time <= ?';
      params.push(endTime);
    }

    
    query += ' ORDER BY create_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));

    let countQuery = 'SELECT COUNT(*) as total FROM reimbursement_lists WHERE creator_id = ?';
    let countParams = [creatorId];

    if (activityName) {
      countQuery += ' AND activity_name LIKE ?';
      countParams.push(`%${activityName}%`);
    }


    if (normalizedStatus !== undefined) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (startTime) {
      countQuery += ' AND create_time >= ?';
      countParams.push(startTime);
    }

    if (endTime) {
      countQuery += ' AND create_time <= ?';
      countParams.push(endTime);
    }

    // console.log('query:', query)
    // console.log('params:', params)
    const countResult = await DatabaseUtil.execute(countQuery, countParams);
    const rows = await DatabaseUtil.execute(query, params);

    return {
      total: countResult[0].total,
      pageNum: parseInt(pageNum),
      pageSize: parseInt(pageSize),
      records: rows
    };
  },

  // 根据ID获取清单详情
  getById: async (listId, userId) => {
    const query = `SELECT 
      list_id as listId, 
      activity_name as activityName, 
      total_amount as totalAmount, 
      status, 
      create_time as createTime, 
      update_time as updateTime 
    FROM reimbursement_lists 
    WHERE list_id = ? AND creator_id = ?`;

    const rows = await DatabaseUtil.execute(query, [listId, userId]);
    return rows[0];
  },

  // 更新清单状态
  updateStatus: async (listId, userId, status) => {
    const query = 'UPDATE reimbursement_lists SET status = ?, update_time = NOW() WHERE list_id = ? AND creator_id = ?';  // 时间在SQL层面更新
    const result = await DatabaseUtil.execute(query, [status, listId, userId]);
    return result.affectedRows > 0;
  },

  // 删除清单
  deleteById: async (listId, userId) => {
    // 原本使用的事务性操作
    try {

      // 先删除关联的账单
      await DatabaseUtil.execute('DELETE FROM bills WHERE list_id = ?', [listId]);

      // 再删除清单
      const result = await DatabaseUtil.execute('DELETE FROM reimbursement_lists WHERE list_id = ? AND creator_id = ?', [listId, userId]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = ReimbursementList;