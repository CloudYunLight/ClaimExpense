const express = require('express');
const { authenticateToken } = require('../middleware/auth.mid');
const DatabaseUtil = require('../utils/database'); // 数据库操作

const router = express.Router();

// 获取个人报销汇总
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    // 构建查询条件
    let dateCondition = '';
    const params = [userId];

    if (startDate && endDate) {
      dateCondition = ' AND create_time BETWEEN ? AND ?';
      params.push(startDate);
      params.push(endDate);
    } else if (startDate) {
      dateCondition = ' AND create_time >= ?';
      params.push(startDate);
    } else if (endDate) {
      dateCondition = ' AND create_time <= ?';
      params.push(endDate);
    }

    // 总清单数
    const totalListQuery = `SELECT COUNT(*) as count FROM reimbursement_lists WHERE creator_id = ? ${dateCondition}`;
    const totalListResult = await DatabaseUtil.execute(totalListQuery,params)
    // 总金额
    const totalAmountQuery = `SELECT COALESCE(SUM(total_amount), 0) as total FROM reimbursement_lists WHERE creator_id = ? ${dateCondition}`;
    const totalAmountResult = await DatabaseUtil.execute(totalAmountQuery, params);

    // 不同状态的清单数
    const statusCountQuery = `SELECT status, COUNT(*) as count FROM reimbursement_lists WHERE creator_id = ? ${dateCondition} GROUP BY status`;
    const statusCountResults = await DatabaseUtil.execute(statusCountQuery, params);

    // 初始化各种状态的数量
    let unrepaidListCount = 0;
    let submittedListCount = 0;
    let repaidListCount = 0;

    statusCountResults.forEach(row => {
      switch (row.status) {
        case 0: // 未报销
          unrepaidListCount = row.count;
          break;
        case 1: // 已上交文件
          submittedListCount = row.count;
          break;
        case 2: // 已回款
          repaidListCount = row.count;
          break;
      }
    });

    // 已回款金额
    const repaidAmountQuery = `SELECT COALESCE(SUM(total_amount), 0) as total FROM reimbursement_lists WHERE creator_id = ? AND status = 2 ${dateCondition.replace(/creator_id/g, 'rl.creator_id')}`;
    const repaidAmountResult = await DatabaseUtil.execute(repaidAmountQuery, params);

    const totalListCount = totalListResult[0].count;
    const totalAmount = parseFloat(totalAmountResult[0].total || 0);
    const repaidAmount = parseFloat(repaidAmountResult[0].total || 0);
    const unrepaidAmount = totalAmount - repaidAmount;

    res.status(200).json({
      code: 200,
      msg: '查询成功',
      data: {
        totalListCount,
        totalAmount,
        repaidAmount,
        unrepaidAmount,
        unrepaidListCount,
        submittedListCount,
        repaidListCount
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 获取报销状态分布
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    // 构建查询条件
    let dateCondition = '';
    const params = [userId];

    if (startDate && endDate) {
      dateCondition = ' AND rl.create_time BETWEEN ? AND ?';
      params.push(startDate);
      params.push(endDate);
    } else if (startDate) {
      dateCondition = ' AND rl.create_time >= ?';
      params.push(startDate);
    } else if (endDate) {
      dateCondition = ' AND rl.create_time <= ?';
      params.push(endDate);
    }

    // 查询各状态的统计信息
    const statusDistributionQuery = `
      SELECT 
        rl.status,
        COUNT(*) as statusCount,
        COALESCE(SUM(rl.total_amount), 0) as statusAmount
      FROM reimbursement_lists rl
      WHERE rl.creator_id = ? ${dateCondition}
      GROUP BY rl.status
    `;

    const results = await DatabaseUtil.execute(statusDistributionQuery, params);

    // 计算总数和总金额用于百分比计算
    const totalQuery = `SELECT COUNT(*) as totalCount, COALESCE(SUM(total_amount), 0) as totalAmount FROM reimbursement_lists WHERE creator_id = ? ${dateCondition}`;
    const totalResult = await DatabaseUtil.execute(totalQuery, params);

    const totalCount = totalResult[0].totalCount;
    const totalAmount = parseFloat(totalResult[0].totalAmount || 0);

    // 添加百分比
    const resultsWithPercentage = results.map(row => ({
      status: row.status,
      statusCount: row.statusCount,
      statusAmount: parseFloat(row.statusAmount),
      percentage: totalCount > 0 ? parseFloat(((row.statusCount / totalCount) * 100).toFixed(1)) : 0
    }));

    res.status(200).json({
      code: 200,
      msg: '查询成功',
      data: resultsWithPercentage,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Get status distribution error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

module.exports = router;