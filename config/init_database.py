#!/usr/bin/env python3
"""
项目启动脚本 - 自动创建数据库和所有表
支持 users, reimbursement_lists, bills 表的创建
"""

import os
import sys
import configparser
import logging
import pymysql
from datetime import datetime
from typing import Dict, List, Tuple, Optional

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('init_database.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class DatabaseInitializer:
    def __init__(self, config_file='config.ini'):
        """
        初始化数据库连接配置
        
        Args:
            config_file: 配置文件路径
        """
        self.config_file = config_file
        self.config = self._load_config()
        
    def _load_config(self) -> configparser.ConfigParser:
        """
        加载配置文件
        """
        if not os.path.exists(self.config_file):
            logger.error(f"配置文件 {self.config_file} 不存在")
            sys.exit(1)
            
        config = configparser.ConfigParser()
        config.read(self.config_file, encoding='utf-8')
        
        # 验证必要的配置项
        required_sections = ['database']
        required_keys = {
            'database': ['host', 'port', 'username', 'password', 'database', 'charset']
        }
        
        for section in required_sections:
            if section not in config:
                logger.error(f"配置文件中缺少 [{section}] 部分")
                sys.exit(1)
                
            for key in required_keys[section]:
                if key not in config[section]:
                    logger.error(f"配置文件中缺少 {section}.{key}")
                    sys.exit(1)
                    
        return config
    
    def _get_database_config(self, include_db: bool = False) -> Dict:
        """
        获取数据库配置
        
        Args:
            include_db: 是否包含数据库名
            
        Returns:
            数据库连接配置字典
        """
        db_config = {
            'host': self.config['database']['host'],
            'port': int(self.config['database']['port']),
            'user': self.config['database']['username'],
            'password': self.config['database']['password'],
            'charset': self.config['database']['charset'],
            'autocommit': False
        }
        
        if include_db:
            db_config['database'] = self.config['database']['database']
            
        return db_config
    
    def _get_connection(self, include_db: bool = False):
        """
        获取数据库连接
        
        Args:
            include_db: 是否连接到特定数据库
        """
        try:
            db_config = self._get_database_config(include_db)
            connection = pymysql.connect(**db_config)
            return connection
        except pymysql.Error as e:
            logger.error(f"数据库连接失败: {e}")
            return None
    
    def create_database(self) -> bool:
        """
        创建数据库（如果不存在）
        
        Returns:
            是否成功
        """
        db_config = self._get_database_config()
        database_name = self.config['database']['database']
        
        try:
            # 连接MySQL服务器（不指定数据库）
            connection = pymysql.connect(**db_config)
            cursor = connection.cursor()
            
            # 创建数据库（如果不存在）
            create_db_sql = f"""
            CREATE DATABASE IF NOT EXISTS `{database_name}`
            CHARACTER SET {self.config['database']['charset']}
            COLLATE utf8mb4_unicode_ci
            """
            
            logger.info(f"正在创建数据库: {database_name}")
            cursor.execute(create_db_sql)
            logger.info(f"数据库 {database_name} 创建成功或已存在")
            
            # 检查数据库字符集
            cursor.execute(f"""
            SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
            FROM INFORMATION_SCHEMA.SCHEMATA
            WHERE SCHEMA_NAME = '{database_name}'
            """)
            charset_info = cursor.fetchone()
            if charset_info:
                logger.info(f"数据库字符集: {charset_info[0]}, 排序规则: {charset_info[1]}")
            
            cursor.close()
            connection.close()
            
            return True
            
        except pymysql.Error as e:
            logger.error(f"创建数据库失败: {e}")
            return False
    
    def create_users_table(self) -> bool:
        """
        创建用户表
        
        Returns:
            是否成功
        """
        try:
            connection = self._get_connection(include_db=True)
            if not connection:
                return False
                
            cursor = connection.cursor()
            
            # 创建用户表的SQL语句
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS `users` (
                `user_id` INT NOT NULL AUTO_INCREMENT COMMENT '用户唯一ID',
                `username` VARCHAR(50) NOT NULL COMMENT '用户名（登录用）',
                `password` VARCHAR(100) NOT NULL COMMENT '密码（BCrypt加密存储）',
                `real_name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
                `role` INT NOT NULL DEFAULT 0 COMMENT '角色（1=admin/0=user）',
                `status` INT NOT NULL DEFAULT 1 COMMENT '账户状态（1=normal/0=locked）',
                `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '账号创建时间',
                PRIMARY KEY (`user_id`),
                UNIQUE KEY `uk_username` (`username`),
                KEY `idx_role` (`role`),
                KEY `idx_status` (`status`),
                KEY `idx_create_time` (`create_time`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='用户表';
            """
            
            logger.info("正在创建 users 表...")
            cursor.execute(create_table_sql)
            
            # 检查表是否创建成功
            cursor.execute("SHOW TABLES LIKE 'users'")
            if cursor.fetchone():
                logger.info("✓ users 表创建成功")
            else:
                logger.error("✗ users 表创建失败")
                return False
            
            connection.commit()
            cursor.close()
            connection.close()
            
            return True
            
        except pymysql.Error as e:
            logger.error(f"创建 users 表失败: {e}")
            return False
    
    def create_reimbursement_lists_table(self) -> bool:
        """
        创建报销清单表
        
        Returns:
            是否成功
        """
        try:
            connection = self._get_connection(include_db=True)
            if not connection:
                return False
                
            cursor = connection.cursor()
            
            # 创建报销清单表的SQL语句
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS `reimbursement_lists` (
                `list_id` INT NOT NULL AUTO_INCREMENT COMMENT '清单唯一ID',
                `activity_name` VARCHAR(100) NOT NULL COMMENT '活动名称',
                `creator_id` INT NOT NULL COMMENT '清单创建人ID',
                `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '账单总金额',
                `status` INT NOT NULL DEFAULT 0 COMMENT '报销状态(0=未报销,1=已上交文件,2=已回款)',
                `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '清单创建时间',
                `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '状态更新时间',
                PRIMARY KEY (`list_id`),
                KEY `idx_creator_id` (`creator_id`),
                KEY `idx_status` (`status`),
                KEY `idx_create_time` (`create_time`),
                KEY `idx_update_time` (`update_time`),
                CONSTRAINT `fk_reimb_lists_creator`
                    FOREIGN KEY (`creator_id`)
                    REFERENCES `users` (`user_id`)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='报销清单表';
            """
            
            logger.info("正在创建 reimbursement_lists 表...")
            cursor.execute(create_table_sql)
            
            # 检查表是否创建成功
            cursor.execute("SHOW TABLES LIKE 'reimbursement_lists'")
            if cursor.fetchone():
                logger.info("✓ reimbursement_lists 表创建成功")
            else:
                logger.error("✗ reimbursement_lists 表创建失败")
                return False
            
            connection.commit()
            cursor.close()
            connection.close()
            
            return True
            
        except pymysql.Error as e:
            logger.error(f"创建 reimbursement_lists 表失败: {e}")
            return False
    
    def create_bills_table(self) -> bool:
        """
        创建账单表
        
        Returns:
            是否成功
        """
        try:
            connection = self._get_connection(include_db=True)
            if not connection:
                return False
                
            cursor = connection.cursor()
            
            # 创建账单表的SQL语句
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS `bills` (
                `bill_id` INT NOT NULL AUTO_INCREMENT COMMENT '账单唯一ID',
                `list_id` INT NOT NULL COMMENT '关联清单ID',
                `payment_method` INT NOT NULL COMMENT '支付方式（0=微信/1=支付宝/2=现金/3=需要转交）',
                `amount` DECIMAL(10,2) NOT NULL COMMENT '金额',
                `payer_id` INT NOT NULL COMMENT '支付人ID',
                `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '账单创建时间',
                `remark` VARCHAR(200) NULL COMMENT '账单备注（可选，如发票号）',
                PRIMARY KEY (`bill_id`),
                KEY `idx_list_id` (`list_id`),
                KEY `idx_payer_id` (`payer_id`),
                KEY `idx_payment_method` (`payment_method`),
                KEY `idx_create_time` (`create_time`),
                CONSTRAINT `fk_bills_list`
                    FOREIGN KEY (`list_id`)
                    REFERENCES `reimbursement_lists` (`list_id`)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE,
                CONSTRAINT `fk_bills_payer`
                    FOREIGN KEY (`payer_id`)
                    REFERENCES `users` (`user_id`)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE,
                CONSTRAINT `chk_amount_positive`
                    CHECK (`amount` > 0)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='账单表';
            """
            
            logger.info("正在创建 bills 表...")
            cursor.execute(create_table_sql)
            
            # 检查表是否创建成功
            cursor.execute("SHOW TABLES LIKE 'bills'")
            if cursor.fetchone():
                logger.info("✓ bills 表创建成功")
            else:
                logger.error("✗ bills 表创建失败")
                return False
            
            connection.commit()
            cursor.close()
            connection.close()
            
            return True
            
        except pymysql.Error as e:
            logger.error(f"创建 bills 表失败: {e}")
            return False
    
    def create_all_tables(self) -> Dict[str, bool]:
        """
        创建所有表
        
        Returns:
            各个表创建结果的字典
        """
        results = {
            'users': self.create_users_table(),
            'reimbursement_lists': self.create_reimbursement_lists_table(),
            'bills': self.create_bills_table()
        }
        
        return results
    
     
    def show_table_info(self):
        """
        显示所有表的信息
        """
        try:
            connection = self._get_connection(include_db=True)
            if not connection:
                return
                
            cursor = connection.cursor()
            
            logger.info("\n数据库表信息:")
            logger.info("-" * 50)
            
            # 获取所有表
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            for table in tables:
                table_name = table[0]
                logger.info(f"\n表名: {table_name}")
                
                # 获取表状态
                cursor.execute(f"SHOW TABLE STATUS LIKE '{table_name}'")
                table_status = cursor.fetchone()
                if table_status:
                    logger.info(f"  记录数: {table_status[4]}")
                    logger.info(f"  引擎: {table_status[1]}")
                    logger.info(f"  字符集: {table_status[14]}")
                
                # 获取字段信息
                cursor.execute(f"DESC {table_name}")
                columns = cursor.fetchall()
                logger.info("  字段列表:")
                for col in columns:
                    logger.info(f"    {col[0]} ({col[1]}) - {col[3]}")
            
            cursor.close()
            connection.close()
            
        except pymysql.Error as e:
            logger.error(f"获取表信息失败: {e}")


def main():
    """
    主函数
    """
    print("=" * 60)
    print("【Python】项目数据库初始化脚本")
    print("=" * 60)
    
    # 检查命令行参数
    config_file = 'config.ini'
    if len(sys.argv) > 1:
        config_file = sys.argv[1]
    
    # 创建初始化器
    initializer = DatabaseInitializer(config_file)
    
    # 显示配置信息
    logger.info("加载的配置信息:")
    for key, value in initializer.config['database'].items():
        if key == 'password':
            logger.info(f"  {key}: {'*' * len(value)}")
        else:
            logger.info(f"  {key}: {value}")
    
    # 询问是否继续
    print("\n" + "=" * 60)
    choice = input("是否继续初始化数据库？(y/N): ").strip().lower()
    
    if choice not in ['y', 'yes']:
        logger.info("用户取消操作")
        sys.exit(0)
    
    # 执行初始化
    print("\n开始初始化数据库...")
    
    # 1. 创建数据库
    if not initializer.create_database():
        logger.error("数据库创建失败，退出程序")
        sys.exit(1)
    
    # 2. 创建所有表
    logger.info("\n开始创建表...")
    results = initializer.create_all_tables()
    
    # 检查创建结果
    all_success = all(results.values())
    if not all_success:
        failed_tables = [table for table, success in results.items() if not success]
        logger.error(f"以下表创建失败: {failed_tables}")
        sys.exit(1)
      
    
    # 5. 显示表信息
    initializer.show_table_info()
    
    # 6. 显示完成信息
    print("\n" + "=" * 60)
    logger.info("数据库初始化完成！")
    logger.info(f"数据库: {initializer.config['database']['database']}")
    logger.info(f"主机: {initializer.config['database']['host']}")
    logger.info(f"端口: {initializer.config['database']['port']}")
    print("=" * 60)


if __name__ == "__main__":
    main()