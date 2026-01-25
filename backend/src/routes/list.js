const express = require('express');
const { authenticateToken } = require('../middleware/auth.mid');
const ReimbursementList = require('../models/ReimbursementList');

const router = express.Router();

// 创建报销清单
router.post('/CreateLists', authenticateToken, async (req, res) => {
  try {
    const { activityName } = req.body;
    const userId = req.user.userId;

    if (!activityName) {
      return res.status(400).json({
        code: 400,
        msg: '活动名称不能为空',
        data: null,
        timestamp: Date.now()
      });
    }

    // 检查是否已存在相同的活动名称和创建者，实现幂等性
    const existingList = await ReimbursementList.getByActivityNameAndCreator(activityName, userId);
    if (existingList) {
      // 如果已存在相同的清单，则直接返回已存在的清单ID，实现幂等性
      return res.status(200).json({
        code: 200,
        msg: '近三小时内有同账户下有同名清单，请检查：现有清单ID',
        data: {
          listId: existingList.listId
        },
        timestamp: Date.now()
      });
    }

    const result = await ReimbursementList.create({
      activityName,
      creatorId: userId
    });

    res.status(200).json({
      code: 200,
      msg: '清单创建成功',
      data: {
        listId: result.listId
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 查询个人清单列表
router.get('/SearchLists', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      pageNum = 1, 
      pageSize = 10, 
      activityName, 
      status, 
      startTime, 
      endTime 
    } = req.query;

    const filters = {};
    if (activityName) filters.activityName = activityName;
    if (status !== undefined) filters.status = status;
    if (startTime) filters.startTime = startTime;
    if (endTime) filters.endTime = endTime;

    const result = await ReimbursementList.getByCreatorId(
      userId, 
      parseInt(pageNum), 
      parseInt(pageSize), 
      filters
    );

    res.status(200).json({
      code: 200,
      msg: '查询成功',
      data: {
        total: result.total,
        pageNum: result.pageNum,
        pageSize: result.pageSize,
        list: result.records
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Search lists error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 查询清单详情
router.get('/:listId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const listId = parseInt(req.params.listId);

    if (!listId) {
      return res.status(400).json({
        code: 400,
        msg: '清单ID不能为空',
        data: null,
        timestamp: Date.now()
      });
    }

    // 获取清单信息
    const listInfo = await ReimbursementList.getById(listId, userId);
    if (!listInfo) {
      return res.status(404).json({
        code: 404,
        msg: '清单不存在或无权限访问',
        data: null,
        timestamp: Date.now()
      });
    }

    // 获取关联账单
    const Bill = require('../models/Bill');
    const bills = await Bill.getByListId(listId);

    res.status(200).json({
      code: 200,
      msg: '查询成功',
      data: {
        listInfo,
        bills
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Get list detail error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 更新清单状态
router.post('/:listId/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const listId = parseInt(req.params.listId);
    const { status } = req.body;

    if (!listId || status === undefined || status === null) {
      return res.status(400).json({
        code: 400,
        msg: '清单ID和状态不能为空',
        data: null,
        timestamp: Date.now()
      });
    }

    // 验证状态值是否合法（0, 1, 2）
    if (![0, 1, 2].includes(parseInt(status))) {
      return res.status(400).json({
        code: 400,
        msg: '状态值不合法，必须为0(未报销)、1(已上交文件)或2(已回款)',
        data: null,
        timestamp: Date.now()
      });
    }

    const result = await ReimbursementList.updateStatus(listId, userId, status);

    if (!result) {
      return res.status(404).json({
        code: 404,
        msg: '清单不存在或无权限更新',
        data: null,
        timestamp: Date.now()
      });
    }

    res.status(200).json({
      code: 200,
      msg: '状态更新成功',
      data: status,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Update list status error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 删除清单
router.post('/ListsDelete/:listId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const listId = parseInt(req.params.listId);

    if (!listId) {
      return res.status(400).json({
        code: 400,
        msg: '清单ID不能为空',
        data: null,
        timestamp: Date.now()
      });
    }

    const result = await ReimbursementList.deleteById(listId, userId);

    if (!result) {
      return res.status(404).json({
        code: 404,
        msg: '清单不存在或无权限删除',
        data: null,
        timestamp: Date.now()
      });
    }

    res.status(200).json({
      code: 200,
      msg: '清单删除成功',
      data: null,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

module.exports = router;