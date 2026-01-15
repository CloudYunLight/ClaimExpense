const db = require('./index');

const ReimbursementList = {
  // 创建报销清单
  create: async (listData) => {
    const { activityName, creatorId } = listData;
    const query = 'INSERT INTO reimbursement_lists (activity_name, creator_id, total_amount, status) VALUES (?, ?, 0, 0)';
    
    const [result] = await db.execute(query, [activityName, creatorId]);
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
    const params = [creatorId];
    
    if (activityName) {
      query += ' AND activity_name LIKE ?';
      params.push(`%${activityName}%`);
    }
    
    if (status !== undefined && status !== null) {
      query += ' AND status = ?';
      params.push(status);
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
    
    const countQuery = 'SELECT COUNT(*) as total FROM reimbursement_lists WHERE creator_id = ?';
    const countParams = [creatorId];
    
    if (activityName) {
      countQuery += ' AND activity_name LIKE ?';
      countParams.push(`%${activityName}%`);
    }
    
    if (status !== undefined && status !== null) {
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
    
    const [countResult] = await db.execute(countQuery, countParams);
    const [rows] = await db.execute(query, params);
    
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
    
    const [rows] = await db.execute(query, [listId, userId]);
    return rows[0];
  },

  // 更新清单状态
  updateStatus: async (listId, userId, status) => {
    const query = 'UPDATE reimbursement_lists SET status = ?, update_time = NOW() WHERE list_id = ? AND creator_id = ?';
    const [result] = await db.execute(query, [status, listId, userId]);
    return result.affectedRows > 0;
  },

  // 删除清单
  deleteById: async (listId, userId) => {
    // 使用事务确保数据一致性
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // 先删除关联的账单
      await connection.execute('DELETE FROM bills WHERE list_id = ?', [listId]);
      
      // 再删除清单
      const [result] = await connection.execute('DELETE FROM reimbursement_lists WHERE list_id = ? AND creator_id = ?', [listId, userId]);
      
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

module.exports = ReimbursementList;