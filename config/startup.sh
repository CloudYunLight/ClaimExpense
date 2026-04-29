#!/bin/bash
# 项目启动脚本 - 支持多表创建

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${CONFIG_FILE:-$SCRIPT_DIR/config.ini}"

echo "========================================"
echo "    项目数据库初始化脚本"
echo "========================================"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}错误: 未找到 Python3，请先安装 Python3${NC}"
    exit 1
fi

if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}错误: 未找到 pip3，请先安装 pip3${NC}"
    exit 1
fi

echo -e "${YELLOW}正在检查Python依赖...${NC}"
if ! python3 -c "import pymysql" &> /dev/null; then
    echo -e "${RED}请自行安装 pymysql...${NC}"
    echo -e "${RED}pip3 install pymysql${NC}"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    if [ -z "${DB_HOST:-}" ] || [ -z "${DB_PORT:-}" ] || [ -z "${DB_USER:-}" ] || [ -z "${DB_PASSWORD:-}" ] || [ -z "${DB_NAME:-}" ]; then
        echo -e "${RED}错误: 未找到配置文件 $CONFIG_FILE，且环境变量 DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME 未完整设置${NC}"
        echo "可通过 CONFIG_FILE 指定配置文件，或直接提供数据库环境变量"
        exit 1
    fi
    echo -e "${YELLOW}未找到配置文件，改为使用环境变量进行初始化${NC}"
else
    echo -e "${GREEN}配置文件检查通过: $CONFIG_FILE${NC}"
fi

echo ""
echo "配置摘要:"
echo "---------"
python3 - "$CONFIG_FILE" <<'PY'
import configparser
import os
import sys

config_path = sys.argv[1]
config = configparser.ConfigParser()
if os.path.exists(config_path):
    config.read(config_path)

db_config = config['database'] if 'database' in config else {}
print(f'主机: {db_config.get("host", os.getenv("DB_HOST", "未设置"))}')
print(f'端口: {db_config.get("port", os.getenv("DB_PORT", "未设置"))}')
print(f'用户名: {db_config.get("username", os.getenv("DB_USER", "未设置"))}')
print(f'数据库: {db_config.get("database", os.getenv("DB_NAME", "未设置"))}')
print(f'字符集: {db_config.get("charset", os.getenv("DB_CHARSET", "未设置"))}')
PY
echo ""

read -p "是否继续初始化数据库？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作取消"
    exit 0
fi

echo -e "${YELLOW}正在初始化数据库...${NC}"
python3 "$SCRIPT_DIR/init_database.py" "$CONFIG_FILE"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    数据库初始化过程结束！${NC}"
echo -e "${GREEN}========================================${NC}"