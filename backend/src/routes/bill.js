const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Bill = require('../models/Bill');

const router = express.Router();

// 添加账单
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { listId, paymentMethod, amount, remark } = req.body;
    const userId = req.user.userId; // 支付人ID为当前用户

    if (!listId || paymentMethod === undefined || amount === undefined) {
      return res.status(400).json({
        code: 400,
        msg: '清单ID、支付方式和金额不能为空',
        data: null,
        timestamp: Date.now()
      });
    }

    // 验证支付方式
    if (![0, 1, 2, 3].includes(parseInt(paymentMethod))) {
      return res.status(400).json({
        code: 400,
        msg: '支付方式不合法，必须为0(微信)、1(支付宝)、2(现金)或3(需要转交)',
        data: null,
        timestamp: Date.now()
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        code: 400,
        msg: '金额必须大于0',
        data: null,
        timestamp: Date.now()
      });
    }

    const billData = {
      listId,
      paymentMethod,
      amount,
      payerId: userId,
      remark: remark || null
    };

    const result = await Bill.create(billData);

    res.status(200).json({
      code: 200,
      msg: '账单添加成功',
      data: {
        billId: result.billId
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Add bill error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 编辑账单
router.post('/:billId', authenticateToken, async (req, res) => {
  try {
    const billId = parseInt(req.params.billId);
    const { paymentMethod, amount, remark } = req.body;
    const userId = req.user.userId;

    if (!billId) {
      return res.status(400).json({
        code: 400,
        msg: '账单ID不能为空',
        data: null,
        timestamp: Date.now()
      });
    }

    if (paymentMethod === undefined || amount === undefined) {
      return res.status(400).json({
        code: 400,
        msg: '支付方式和金额不能为空',
        data: null,
        timestamp: Date.now()
      });
    }

    // 验证支付方式
    if (![0, 1, 2, 3].includes(parseInt(paymentMethod))) {
      return res.status(400).json({
        code: 400,
        msg: '支付方式不合法，必须为0(微信)、1(支付宝)、2(现金)或3(需要转交)',
        data: null,
        timestamp: Date.now()
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        code: 400,
        msg: '金额必须大于0',
        data: null,
        timestamp: Date.now()
      });
    }

    const billData = {
      paymentMethod,
      amount,
      remark: remark || null
    };

    const result = await Bill.updateById(billId, userId, billData);

    if (!result.success) {
      return res.status(404).json({
        code: 404,
        msg: result.message,
        data: null,
        timestamp: Date.now()
      });
    }

    res.status(200).json({
      code: 200,
      msg: '账单更新成功',
      data: null,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Update bill error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 删除账单
router.post('/delete/:billId', authenticateToken, async (req, res) => {
  try {
    const billId = parseInt(req.params.billId);
    const userId = req.user.userId;

    if (!billId) {
      return res.status(400).json({
        code: 400,
        msg: '账单ID不能为空',
        data: null,
        timestamp: Date.now()
      });
    }

    const result = await Bill.deleteById(billId, userId);

    if (!result) {
      return res.status(404).json({
        code: 404,
        msg: '账单不存在或无权限删除',
        data: null,
        timestamp: Date.now()
      });
    }

    res.status(200).json({
      code: 200,
      msg: '账单删除成功',
      data: null,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Delete bill error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

// 查询个人支付的账单
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      pageNum = 1, 
      pageSize = 10, 
      listId, 
      paymentMethod, 
      startTime, 
      endTime 
    } = req.query;

    const filters = {};
    if (listId) filters.listId = listId;
    if (paymentMethod !== undefined) filters.paymentMethod = paymentMethod;
    if (startTime) filters.startTime = startTime;
    if (endTime) filters.endTime = endTime;

    const result = await Bill.getByPayerId(
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
        pages: Math.ceil(result.total / result.pageSize),
        current: result.pageNum,
        size: result.pageSize,
        records: result.records
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Get my bills error:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
      data: null,
      timestamp: Date.now()
    });
  }
});

module.exports = router;