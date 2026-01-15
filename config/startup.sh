#!/bin/bash
# 项目启动脚本 - 支持多表创建

set -e  # 遇到错误时退出

echo "========================================"
echo "    项目数据库初始化脚本"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}错误: 未找到 Python3，请先安装 Python3${NC}"
    exit 1
fi

# 检查pip是否安装
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}错误: 未找到 pip3，请先安装 pip3${NC}"
    exit 1
fi

# 安装依赖
echo -e "${YELLOW}正在检查Python依赖...${NC}"
if ! pip3 list 2>/dev/null | grep -q PyMySQL; then
#if ! pip3 list | grep -q PyMySQL; then
    echo -e "${RED}请自行安装 pymysql...${NC}"
    echo -e "${RED}pip3 install pymysql${NC}"
    exit 1
fi

if ! pip3 list 2>/dev/null | grep -q configparser; then
    echo -e "${RED}请自行安装 configparser...${NC}"
    echo -e "${RED}pip3 install configparser${NC}"
    exit 1
fi


# 检查配置文件
if [ ! -f "config.ini" ]; then
    echo -e "${RED}错误: 未找到 config.ini 配置文件${NC}"
    echo "【参考config.ini.example文件】"
    exit 1
fi

# 显示配置摘要
echo -e "${GREEN}配置文件检查通过${NC}"
echo ""
echo "配置摘要:"
echo "---------"
python3 -c "
import configparser
config = configparser.ConfigParser()
config.read('config.ini')
db_config = config['database']
print(f'主机: {db_config[\"host\"]}')
print(f'端口: {db_config[\"port\"]}')
print(f'用户名: {db_config[\"username\"]}')
print(f'数据库: {db_config[\"database\"]}')
print(f'字符集: {db_config[\"charset\"]}')
"
echo ""

# 确认操作
read -p "是否继续初始化数据库？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作取消"
    exit 0
fi

# 运行初始化脚本
echo -e "${YELLOW}正在初始化数据库...${NC}"
python3 init_database.py

# 检查执行结果
if [ $? -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}    数据库初始化过程结束！${NC}"
    echo -e "${GREEN}========================================${NC}"
fi