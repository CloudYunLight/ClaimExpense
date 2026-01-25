# ExpenseClaim 项目API接口文档

本文档梳理了后端所有可用的API接口，供前端开发参考。

## 通用说明

- 所有接口返回的数据格式统一为：
```json
{
  "code": 200,
  "msg": "操作描述",
  "data": {},
  "timestamp": 1234567890
}
```
- 所有需要认证的接口都需要在请求头中携带 `Authorization: Bearer {token}`

## 接口列表

### 1. 认证相关接口

#### 1.1 用户登录
- **接口**: `POST /api/v1/auth/login`
- **功能**: 用户登录
- **请求体**:
```json
{
  "username": "用户名",
  "password": "密码"
}
```
- **响应体**:
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "JWT令牌",
    "userInfo": {
      "userId": "用户ID",
      "username": "用户名",
      "realName": "真实姓名",
      "role": "角色",
      "status": "状态"
    }
  },
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 400: 用户名和密码不能为空
  - 401: 用户名或密码错误，账户已被锁定

#### 1.2 修改密码
- **接口**: `POST /api/v1/auth/ChangePassword`
- **功能**: 修改密码（需认证）
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "oldPassword": "旧密码",
  "newPassword": "新密码"
}
```
- **响应体**:
```json
{
  "code": 200,
  "msg": "密码修改成功",
  "data": null,
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 400: 旧密码和新密码不能为空，旧密码错误
  - 401: 未授权访问
  - 404: 用户不存在

#### 1.3 用户登出
- **接口**: `POST /api/v1/auth/logout`
- **功能**: 用户登出（需认证）
- **请求头**: `Authorization: Bearer {token}`
- **响应体**:
```json
{
  "code": 200,
  "msg": "登出成功",
  "data": null,
  "timestamp": 1234567890
}
```

#### 1.4 获取当前用户信息
- **接口**: `GET /api/v1/auth/me`
- **功能**: 获取当前登录用户信息（需认证）
- **请求头**: `Authorization: Bearer {token}`
- **响应体**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "userId": "用户ID",
    "username": "用户名",
    "realName": "真实姓名",
    "role": "角色",
    "status": "状态"
  },
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 401: 未授权访问
  - 404: 用户不存在

### 2. 报销清单相关接口

#### 2.1 创建报销清单
- **接口**: `POST /api/v1/lists/CreateLists`
- **功能**: 创建报销清单（需认证）
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "activityName": "活动名称"
}
```
- **响应体**:
```json
{
  "code": 200,
  "msg": "清单创建成功",
  "data": {
    "listId": "清单ID"
  },
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 400: 活动名称不能为空
  - 409: 近三小时内有同账户下有同名清单

#### 2.2 查询个人清单列表
- **接口**: `GET /api/v1/lists/SearchLists`
- **功能**: 查询个人清单列表（需认证）
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  - `pageNum`: 页码，默认为1
  - `pageSize`: 每页数量，默认为10
  - `activityName`: 活动名称（可选）
  - `status`: 状态（可选）
  - `startTime`: 开始时间（可选）
  - `endTime`: 结束时间（可选）
- **响应体**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "total": "总记录数",
    "pageNum": "当前页码",
    "pageSize": "每页大小",
    "list": [
      {
        "listId": "清单ID",
        "activityName": "活动名称",
        "creatorId": "创建者ID",
        "totalAmount": "总金额",
        "status": "状态",
        "createTime": "创建时间",
        "updateTime": "更新时间"
      }
    ]
  },
  "timestamp": 1234567890
}
```

#### 2.3 查询清单详情
- **接口**: `GET /api/v1/lists/{listId}`
- **功能**: 查询清单详情（需认证）
- **路径参数**: `listId` 清单ID
- **请求头**: `Authorization: Bearer {token}`
- **响应体**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "listInfo": {
      "listId": "清单ID",
      "activityName": "活动名称",
      "creatorId": "创建者ID",
      "totalAmount": "总金额",
      "status": "状态",
      "createTime": "创建时间",
      "updateTime": "更新时间"
    },
    "bills": [
      {
        "billId": "账单ID",
        "listId": "清单ID",
        "paymentMethod": "支付方式",
        "amount": "金额",
        "payerId": "支付人ID",
        "payerName": "支付人姓名",
        "remark": "备注",
        "createTime": "创建时间",
        "updateTime": "更新时间"
      }
    ]
  },
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 400: 清单ID不能为空
  - 404: 清单不存在或无权限访问

#### 2.4 更新清单状态
- **接口**: `POST /api/v1/lists/{listId}/status`
- **功能**: 更新清单状态（需认证）
- **路径参数**: `listId` 清单ID
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "status": 0 // 0-未报销，1-已上交文件，2-已回款
}
```
- **响应体**:
```json
{
  "code": 200,
  "msg": "状态更新成功",
  "data": 0, // 状态值
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 400: 清单ID和状态不能为空，状态值不合法
  - 404: 清单不存在或无权限更新

#### 2.5 删除清单
- **接口**: `POST /api/v1/lists/ListsDelete/{listId}`
- **功能**: 删除清单（需认证）
- **路径参数**: `listId` 清单ID
- **请求头**: `Authorization: Bearer {token}`
- **响应体**:
```json
{
  "code": 200,
  "msg": "清单删除成功",
  "data": null,
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 400: 清单ID不能为空
  - 404: 清单不存在或无权限删除

### 3. 账单相关接口

#### 3.1 添加账单
- **接口**: `POST /api/v1/bills/`
- **功能**: 添加账单（需认证）
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "listId": "清单ID",
  "paymentMethod": 0, // 0-微信，1-支付宝，2-现金，3-需要转交
  "amount": "金额",
  "remark": "备注（可选）"
}
```
- **响应体**:
```json
{
  "code": 200,
  "msg": "账单添加成功",
  "data": {
    "billId": "账单ID"
  },
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 400: 清单ID、支付方式和金额不能为空，支付方式不合法，金额必须大于0
  - 403: 无法找到对应的报销清单，或未授权
  - 404: 已存在相同的账单数据

#### 3.2 编辑账单
- **接口**: `POST /api/v1/bills/{billId}`
- **功能**: 编辑账单（需认证）
- **路径参数**: `billId` 账单ID
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "paymentMethod": 0, // 0-微信，1-支付宝，2-现金，3-需要转交
  "amount": "金额",
  "remark": "备注（可选）"
}
```
- **响应体**:
```json
{
  "code": 200,
  "msg": "账单更新成功",
  "data": null,
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 400: 账单ID、支付方式和金额不能为空，支付方式不合法，金额必须大于0
  - 404: 账单不存在或无权限更新

#### 3.3 删除账单
- **接口**: `POST /api/v1/bills/delete/{billId}`
- **功能**: 删除账单（需认证）
- **路径参数**: `billId` 账单ID
- **请求头**: `Authorization: Bearer {token}`
- **响应体**:
```json
{
  "code": 200,
  "msg": "账单删除成功",
  "data": null,
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 400: 账单ID不能为空
  - 404: 账单不存在或无权限删除

#### 3.4 查询个人支付的账单
- **接口**: `GET /api/v1/bills/my`
- **功能**: 查询个人支付的账单（需认证）
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  - `pageNum`: 页码，默认为1
  - `pageSize`: 每页数量，默认为10
  - `listId`: 清单ID（可选）
  - `paymentMethod`: 支付方式（可选）
  - `startTime`: 开始时间（可选）
  - `endTime`: 结束时间（可选）
- **响应体**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "total": "总记录数",
    "pages": "总页数",
    "current": "当前页码",
    "size": "每页大小",
    "records": [
      {
        "billId": "账单ID",
        "listId": "清单ID",
        "listName": "清单名称",
        "paymentMethod": 0, // 0-微信，1-支付宝，2-现金，3-需要转交
        "amount": "金额",
        "remark": "备注",
        "createTime": "创建时间",
        "updateTime": "更新时间"
      }
    ]
  },
  "timestamp": 1234567890
}
```

### 4. 用户管理相关接口（仅管理员）

#### 4.1 获取用户列表
- **接口**: `GET /api/v1/admin/users`
- **功能**: 获取用户列表（仅管理员，需认证）
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  - `pageNum`: 页码，默认为1
  - `pageSize`: 每页数量，默认为10
  - `username`: 用户名（可选）
  - `realName`: 真实姓名（可选）
  - `status`: 状态（可选）
- **响应体**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "total": "总记录数",
    "pages": "总页数",
    "current": "当前页码",
    "size": "每页大小",
    "records": [
      {
        "user_id": "用户ID",
        "username": "用户名",
        "real_name": "真实姓名",
        "role": "角色",
        "status": "状态",
        "create_time": "创建时间",
        "update_time": "更新时间"
      }
    ]
  },
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 403: 无权限访问

#### 4.2 新增用户
- **接口**: `POST /api/v1/admin/addUsers`
- **功能**: 新增用户（仅管理员，需认证）
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "usernameAdd": "用户名",
  "realNameAdd": "真实姓名"
}
```
- **响应体**:
```json
{
  "code": 200,
  "msg": "用户创建成功",
  "data": {
    "userId": "用户ID",
    "initialPassword": "初始密码"
  },
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 400: 新增的用户名和真实姓名不能为空
  - 403: 无权限访问
  - 409: 用户名已存在

#### 4.3 重置用户密码
- **接口**: `POST /api/v1/admin/users/{userId}/resetPassword`
- **功能**: 重置用户密码（仅管理员，需认证）
- **路径参数**: `userId` 用户ID
- **请求头**: `Authorization: Bearer {token}`
- **响应体**:
```json
{
  "code": 200,
  "msg": "密码重置成功",
  "data": {
    "newPassword": "新密码"
  },
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 403: 无权限访问
  - 404: 用户不存在

#### 4.4 启停用户账户
- **接口**: `POST /api/v1/admin/users/{userId}/status`
- **功能**: 启停用户账户（仅管理员，需认证）
- **路径参数**: `userId` 用户ID
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "status": 1 // 0-锁定，1-正常
}
```
- **响应体**:
```json
{
  "code": 200,
  "msg": "账户状态更新成功",
  "data": "启用成功", // 或 "锁定成功"
  "timestamp": 1234567890
}
```
- **错误响应**:
  - 400: 状态值必须为0（锁定）或1（正常）
  - 403: 无权限访问
  - 404: 用户不存在

### 5. 仪表盘相关接口

#### 5.1 获取个人报销汇总
- **接口**: `GET /api/v1/dashboard/summary`
- **功能**: 获取个人报销汇总（需认证）
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  - `startDate`: 开始日期（可选）
  - `endDate`: 结束日期（可选）
- **响应体**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "totalListCount": "总清单数",
    "totalAmount": "总金额",
    "repaidAmount": "已回款金额",
    "unrepaidAmount": "未回款金额",
    "unrepaidListCount": "未报销清单数",
    "submittedListCount": "已提交清单数",
    "repaidListCount": "已回款清单数"
  },
  "timestamp": 1234567890
}
```

#### 5.2 获取报销状态分布
- **接口**: `GET /api/v1/dashboard/status`
- **功能**: 获取报销状态分布（需认证）
- **请求头**: `Authorization: Bearer {token}`
- **查询参数**:
  - `startDate`: 开始日期（可选）
  - `endDate`: 结束日期（可选）
- **响应体**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": [
    {
      "status": "状态码",
      "statusCount": "该状态下的数量",
      "statusAmount": "该状态下的金额",
      "percentage": "百分比"
    }
  ],
  "timestamp": 1234567890
}
```

### 6. 其他接口

#### 6.1 健康检查
- **接口**: `ALL /health`
- **功能**: 检查服务健康状态
- **无需认证**
- **响应体**:
```json
{
  "status": "OK",
  "timestamp": "2023-01-01T10:00:00.000Z",
  "uptime_seconds": 3600,
  "message": "Expense Claim API is running smoothly",
  "method": "GET"
}
```

## 注意事项

1. 所有需要认证的接口都需要在请求头中携带有效的JWT令牌
2. 管理员接口仅对具有管理员权限的用户开放
3. 时间格式一般采用ISO 8601标准格式
4. 分页查询默认每页10条记录
5. 金额字段应为正数
6. 支付方式枚举值：0-微信，1-支付宝，2-现金，3-需要转交
7. 清单状态枚举值：0-未报销，1-已上交文件，2-已回款
8. 用户状态枚举值：0-锁定，1-正常
9. 用户角色枚举值：0-普通用户，1-管理员