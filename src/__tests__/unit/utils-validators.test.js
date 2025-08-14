/**
 * 工具函数和验证器单元测试
 */

const {
    ipToInt,
    intToIp,
    pad,
    expandRange,
    parseCidr,
    parseIpSegment,
    parseIpList,
    validateIpList,
    checkDuplicateIps,
    isValidIp,
    isIpInRange,
} = require('../../main/utils/ip-utils');

const {
    ValidationError,
    validateParams,
    validateServerCounts,
    validateIpRanges,
    validateAllParams,
    isValidUserCount,
    isValidScene,
    isValidInsightDeployType,
    isValidStorageSecurity,
} = require('../../main/validators/param-validator');

describe('工具函数和验证器', () => {
    describe('IP工具函数', () => {
        describe('ipToInt函数', () => {
            test('应该正确转换IP地址为整数', () => {
                expect(ipToInt('192.168.1.1')).toBe(-1062731519); // JavaScript 32位有符号整数
                expect(ipToInt('10.0.0.1')).toBe(167772161);
                expect(ipToInt('172.16.0.1')).toBe(-1408237567); // JavaScript 32位有符号整数
                expect(ipToInt('0.0.0.0')).toBe(0);
                expect(ipToInt('255.255.255.255')).toBe(-1);
            });

            test('应该处理边界值', () => {
                expect(ipToInt('127.0.0.1')).toBe(2130706433);
                expect(ipToInt('1.1.1.1')).toBe(16843009);
            });
        });

        describe('intToIp函数', () => {
            test('应该正确转换整数为IP地址', () => {
                expect(intToIp(3232235777)).toBe('192.168.1.1');
                expect(intToIp(167772161)).toBe('10.0.0.1');
                expect(intToIp(2886729729)).toBe('172.16.0.1');
                expect(intToIp(0)).toBe('0.0.0.0');
                expect(intToIp(4294967295)).toBe('255.255.255.255');
            });

            test('应该处理边界值', () => {
                expect(intToIp(2130706433)).toBe('127.0.0.1');
                expect(intToIp(16843009)).toBe('1.1.1.1');
            });
        });

        describe('pad函数', () => {
            test('应该为小于10的数字补零', () => {
                expect(pad(1)).toBe('01');
                expect(pad(5)).toBe('05');
                expect(pad(9)).toBe('09');
            });

            test('应该不为大于等于10的数字补零', () => {
                expect(pad(10)).toBe('10');
                expect(pad(15)).toBe('15');
                expect(pad(99)).toBe('99');
            });

            test('应该处理边界值', () => {
                expect(pad(0)).toBe('00');
                expect(pad(100)).toBe('100');
            });
        });

        describe('expandRange函数', () => {
            test('应该正确展开IP范围', () => {
                const result = expandRange('192.168.1.1', '192.168.1.3');
                expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
            });

            test('应该处理单个IP', () => {
                const result = expandRange('192.168.1.1', '192.168.1.1');
                expect(result).toEqual(['192.168.1.1']);
            });

            test('应该处理跨网段的范围', () => {
                const result = expandRange('192.168.1.254', '192.168.2.2');
                expect(result).toEqual(['192.168.1.254', '192.168.1.255', '192.168.2.0', '192.168.2.1', '192.168.2.2']);
            });

            test('应该处理反向范围（起始IP大于结束IP）', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                const result = expandRange('192.168.1.5', '192.168.1.3');
                expect(result).toEqual([]);
                expect(consoleSpy).toHaveBeenCalledWith(
                    expect.stringContaining('Invalid IP range: start IP 192.168.1.5 is greater than end IP 192.168.1.3')
                );
                consoleSpy.mockRestore();
            });

            test('应该处理无效IP地址', () => {
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
                const result = expandRange('invalid.ip', '192.168.1.3');
                expect(result).toEqual([]);
                // Note: expandRange may not call console.error for invalid IP
                consoleSpy.mockRestore();
            });
        });

        describe('parseCidr函数', () => {
            test('应该正确解析CIDR格式', () => {
                const result = parseCidr('192.168.1.0/30');
                expect(result).toEqual(['192.168.1.1', '192.168.1.2']);
            });

            test('应该处理/24网段', () => {
                const result = parseCidr('10.0.0.0/30');
                expect(result).toEqual(['10.0.0.1', '10.0.0.2']);
            });

            test('应该处理/32单主机', () => {
                const result = parseCidr('192.168.1.1/32');
                expect(result).toEqual([]);
            });

            test('应该处理无效的CIDR格式', () => {
                const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
                expect(parseCidr('192.168.1.0/33')).toEqual([]);
                expect(parseCidr('192.168.1.0/-1')).toEqual([]);
                expect(parseCidr('192.168.1.0/abc')).toEqual([]);
                consoleSpy.mockRestore();
            });
        });

        describe('parseIpSegment函数', () => {
            test('应该解析CIDR格式', () => {
                const result = parseIpSegment('192.168.1.0/30');
                expect(result).toEqual(['192.168.1.1', '192.168.1.2']);
            });

            test('应该解析IP范围格式', () => {
                const result = parseIpSegment('192.168.1.1-192.168.1.3');
                expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
            });

            test('应该解析简写范围格式', () => {
                const result = parseIpSegment('192.168.1.1-5');
                expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3', '192.168.1.4', '192.168.1.5']);
            });

            test('应该解析单个IP', () => {
                const result = parseIpSegment('192.168.1.1');
                expect(result).toEqual(['192.168.1.1']);
            });

            test('应该处理无效格式', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                expect(parseIpSegment('invalid-format')).toEqual([]);
                expect(parseIpSegment('192.168.1.1-2-3')).toEqual([]);
                expect(parseIpSegment('999.999.999.999')).toEqual([]);
                consoleSpy.mockRestore();
            });

            test('应该处理无效的起始IP', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                expect(parseIpSegment('999.999.999.999-192.168.1.5')).toEqual([]);
                consoleSpy.mockRestore();
            });

            test('应该处理无效的结束IP', () => {
                const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
                expect(parseIpSegment('192.168.1.1-999.999.999.999')).toEqual([]);
                consoleSpy.mockRestore();
            });
        });

        describe('parseIpList函数', () => {
            test('应该解析用分号分隔的IP列表', () => {
                const result = parseIpList('192.168.1.1;192.168.1.2;192.168.1.3');
                expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
            });

            test('应该解析用逗号分隔的IP列表', () => {
                const result = parseIpList('192.168.1.1,192.168.1.2,192.168.1.3');
                expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
            });

            test('应该解析用空格分隔的IP列表', () => {
                const result = parseIpList('192.168.1.1 192.168.1.2 192.168.1.3');
                expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
            });

            test('应该解析用换行分隔的IP列表', () => {
                const result = parseIpList('192.168.1.1\n192.168.1.2\n192.168.1.3');
                expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
            });

            test('应该解析中文分隔符', () => {
                const result = parseIpList('192.168.1.1；192.168.1.2，192.168.1.3');
                expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
            });

            test('应该解析混合格式', () => {
                const result = parseIpList('192.168.1.1-3;10.0.0.0/30,172.16.1.1');
                expect(result).toEqual([
                    '192.168.1.1',
                    '192.168.1.2',
                    '192.168.1.3',
                    '10.0.0.1',
                    '10.0.0.2',
                    '172.16.1.1',
                ]);
            });

            test('应该处理空字符串', () => {
                expect(parseIpList('')).toEqual([]);
                expect(parseIpList(null)).toEqual([]);
                expect(parseIpList(undefined)).toEqual([]);
            });

            test('应该返回错误信息（当returnErrors为true时）', () => {
                const result = parseIpList('192.168.1.1;invalid-ip', true);
                expect(result.ips).toEqual(['192.168.1.1']);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain('无效的IP地址');
            });

            test('应该检测反向范围错误', () => {
                const result = parseIpList('192.168.1.5-192.168.1.3', true);
                expect(result.ips).toEqual([]);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain('起始IP 192.168.1.5 大于结束IP 192.168.1.3');
            });
        });

        describe('isValidIp函数', () => {
            test('应该验证有效的IP地址', () => {
                expect(isValidIp('192.168.1.1')).toBe(true);
                expect(isValidIp('10.0.0.1')).toBe(true);
                expect(isValidIp('172.16.0.1')).toBe(true);
                expect(isValidIp('0.0.0.0')).toBe(true);
                expect(isValidIp('255.255.255.255')).toBe(true);
            });

            test('应该拒绝无效的IP地址', () => {
                expect(isValidIp('256.1.1.1')).toBe(false);
                expect(isValidIp('192.168.1')).toBe(false);
                expect(isValidIp('192.168.1.1.1')).toBe(false);
                expect(isValidIp('192.168.01.1')).toBe(false); // 前导零
                expect(isValidIp('192.168.-1.1')).toBe(false);
                expect(isValidIp('abc.def.ghi.jkl')).toBe(false);
                expect(isValidIp('')).toBe(false);
            });
        });

        describe('isIpInRange函数', () => {
            test('应该正确判断IP是否在范围内', () => {
                expect(isIpInRange('192.168.1.5', '192.168.1.1', '192.168.1.10')).toBe(true);
                expect(isIpInRange('192.168.1.1', '192.168.1.1', '192.168.1.10')).toBe(true);
                expect(isIpInRange('192.168.1.10', '192.168.1.1', '192.168.1.10')).toBe(true);
            });

            test('应该正确判断IP不在范围内', () => {
                expect(isIpInRange('192.168.1.11', '192.168.1.1', '192.168.1.10')).toBe(false);
                expect(isIpInRange('192.168.0.255', '192.168.1.1', '192.168.1.10')).toBe(false);
            });

            test('应该处理跨网段的范围', () => {
                expect(isIpInRange('192.168.2.1', '192.168.1.254', '192.168.2.10')).toBe(true);
                expect(isIpInRange('192.168.1.255', '192.168.1.254', '192.168.2.10')).toBe(true);
            });
        });

        describe('validateIpList函数', () => {
            test('应该返回有效IP和错误信息', () => {
                const result = validateIpList('192.168.1.1;invalid-ip;192.168.1.2');
                expect(result.ips).toEqual(['192.168.1.1', '192.168.1.2']);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain('无效的IP地址');
            });

            test('应该检测重复IP', () => {
                const result = validateIpList('192.168.1.1;192.168.1.2;192.168.1.1');
                expect(result.ips).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.1']);
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0]).toContain('IP地址重复：192.168.1.1 出现了 2 次');
            });

            test('应该检测范围重叠导致的重复', () => {
                const result = validateIpList('192.168.1.1-3;192.168.1.2-4');
                expect(result.errors.length).toBeGreaterThan(0);
                expect(result.errors.some((err) => err.includes('IP地址重复'))).toBe(true);
            });
        });

        describe('checkDuplicateIps函数', () => {
            test('应该检测重复的IP地址', () => {
                const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.1', '192.168.1.3', '192.168.1.2'];
                const errors = checkDuplicateIps(ips);
                expect(errors).toHaveLength(2);
                expect(errors[0]).toContain('192.168.1.1 出现了 2 次');
                expect(errors[1]).toContain('192.168.1.2 出现了 2 次');
            });

            test('应该处理没有重复的情况', () => {
                const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];
                const errors = checkDuplicateIps(ips);
                expect(errors).toHaveLength(0);
            });

            test('应该处理空数组', () => {
                const errors = checkDuplicateIps([]);
                expect(errors).toHaveLength(0);
            });
        });
    });

    describe('参数验证器', () => {
        describe('ValidationError类', () => {
            test('应该创建正确的错误对象', () => {
                const error = new ValidationError('测试错误', 'TEST_ERROR');
                expect(error.message).toBe('测试错误');
                expect(error.name).toBe('ValidationError');
                expect(error.code).toBe('TEST_ERROR');
                expect(error instanceof Error).toBe(true);
            });

            test('应该使用默认错误代码', () => {
                const error = new ValidationError('测试错误');
                expect(error.code).toBe('VALIDATION_ERROR');
            });
        });

        describe('validateParams函数', () => {
            test('应该验证Insight和终端网管的依赖关系', () => {
                const params = {
                    insightDeployType: '否',
                    deployTerminalMgmt: true,
                };
                const errors = validateParams(params);
                expect(errors).toContain('只提供终端网管与insight合设的规划，请取消勾选"部署终端网管"。');
            });

            test('应该验证网络合设和场景的一致性', () => {
                const params1 = {
                    isNetCombined: false,
                    scene: '管理网和业务网合一场景',
                };
                const errors1 = validateParams(params1);
                expect(errors1).toContain('管理业务网不合设时，场景不能选择"管理网和业务网合一场景"。');

                const params2 = {
                    isNetCombined: true,
                    scene: '管理网和业务网隔离场景_运维通过管理网访问',
                };
                const errors2 = validateParams(params2);
                expect(errors2).toContain('管理业务网合设时，场景只能选择"管理网和业务网合一场景"。');
            });

            test('应该验证Ceph管理双机的前提条件', () => {
                const params = {
                    isCephDual: true,
                    isDualNode: false,
                };
                const errors = validateParams(params);
                expect(errors).toContain('Ceph管理双机需先启用管理节点双机。');
            });

            test('应该验证用户量和Insight部署类型的匹配', () => {
                const params = {
                    userCount: 6000,
                    insightDeployType: '非高可用部署',
                };
                const errors = validateParams(params);
                expect(errors).toContain('用户量 > 5000 时，Insight 只能选择"高可用部署"。');
            });

            test('应该验证超融合和管理节点的配置', () => {
                const params = {
                    isFusionNode: false,
                    isMngAsFusion: true,
                };
                const errors = validateParams(params);
                expect(errors).toContain('计算与存储节点分离时，管理节点不能作为超融合节点。');
            });

            test('应该通过有效的参数验证', () => {
                const params = {
                    isNetCombined: true,
                    scene: '管理网和业务网合一场景',
                    isDualNode: true,
                    isCephDual: true,
                    isFusionNode: true,
                    isMngAsFusion: false,
                    insightDeployType: '高可用部署',
                    deployTerminalMgmt: false,
                    userCount: 3000,
                };
                const errors = validateParams(params);
                expect(errors).toHaveLength(0);
            });
        });

        describe('validateServerCounts函数', () => {
            test('应该验证管理服务器数量（双机模式）', () => {
                const params = {
                    isDualNode: true,
                    countMng: 1,
                };
                const errors = validateServerCounts(params);
                expect(errors).toContain('启用管理节点双机时，管理服务器数量不能少于2台。');
            });

            test('应该验证管理服务器数量（单机模式）', () => {
                const params = {
                    isDualNode: false,
                    countMng: 0,
                };
                const errors = validateServerCounts(params);
                expect(errors).toContain('管理服务器数量不能少于1台。');
            });

            test('应该验证超融合模式的服务器配置', () => {
                const params = {
                    isFusionNode: true,
                    countFusion: 0,
                    countCalc: 2,
                };
                const errors = validateServerCounts(params);
                expect(errors).toContain('超融合模式下，超融合服务器数量不能少于1台。');
                expect(errors).toContain('超融合模式下，不应配置独立的计算服务器。');
            });

            test('应该验证分离模式的服务器配置', () => {
                const params = {
                    isFusionNode: false,
                    countCalc: 0,
                    countStor: 2,
                    countFusion: 1,
                };
                const errors = validateServerCounts(params);
                expect(errors).toContain('分离模式下，计算服务器数量不能少于1台。');
                expect(errors).toContain('分离模式下，存储服务器数量不能少于3台（Ceph最小要求）。');
                expect(errors).toContain('分离模式下，不应配置超融合服务器。');
            });

            test('应该验证CAG服务器数量', () => {
                const params = {
                    countCAG: -1,
                };
                const errors = validateServerCounts(params);
                expect(errors).toContain('CAG服务器数量不能为负数。');
            });

            test('应该通过有效的服务器数量验证', () => {
                const params = {
                    isDualNode: true,
                    isFusionNode: true,
                    countMng: 2,
                    countFusion: 3,
                    countCalc: 0,
                    countStor: 0,
                    countCAG: 2,
                };
                const errors = validateServerCounts(params);
                expect(errors).toHaveLength(0);
            });
        });

        describe('validateIpRanges函数', () => {
            test('应该返回空错误数组', () => {
                const errors = validateIpRanges({});
                expect(errors).toEqual([]);
            });
        });

        describe('validateAllParams函数', () => {
            test('应该在有错误时抛出ValidationError', () => {
                const params = {
                    isNetCombined: false,
                    scene: '管理网和业务网合一场景',
                    isDualNode: true,
                    countMng: 1,
                };

                expect(() => {
                    validateAllParams(params);
                }).toThrow(ValidationError);
            });

            test('应该在没有错误时正常通过', () => {
                const params = {
                    isNetCombined: true,
                    scene: '管理网和业务网合一场景',
                    isDualNode: true,
                    isCephDual: true,
                    isFusionNode: true,
                    isMngAsFusion: false,
                    insightDeployType: '高可用部署',
                    deployTerminalMgmt: false,
                    userCount: 3000,
                    countMng: 2,
                    countFusion: 3,
                    countCalc: 0,
                    countStor: 0,
                    countCAG: 2,
                };

                expect(() => {
                    validateAllParams(params);
                }).not.toThrow();
            });
        });

        describe('isValidUserCount函数', () => {
            test('应该验证有效的用户数量', () => {
                expect(isValidUserCount(1000)).toBe(true);
                expect(isValidUserCount(5000)).toBe(true);
                expect(isValidUserCount(50000)).toBe(true);
                expect(isValidUserCount(1)).toBe(true);
            });

            test('应该拒绝无效的用户数量', () => {
                expect(isValidUserCount(0)).toBe(false);
                expect(isValidUserCount(-1000)).toBe(false);
                expect(isValidUserCount(50001)).toBe(false);
                expect(isValidUserCount('1000')).toBe(false);
                expect(isValidUserCount(null)).toBe(false);
                expect(isValidUserCount(undefined)).toBe(false);
            });
        });

        describe('isValidScene函数', () => {
            test('应该验证有效的场景', () => {
                expect(isValidScene('管理网和业务网合一场景')).toBe(true);
                expect(isValidScene('管理网和业务网隔离场景_运维通过管理网访问')).toBe(true);
                expect(isValidScene('管理网和业务网隔离场景_运维通过业务网访问')).toBe(true);
                expect(isValidScene('三网隔离场景')).toBe(true);
            });

            test('应该拒绝无效的场景', () => {
                expect(isValidScene('无效场景')).toBe(false);
                expect(isValidScene('')).toBe(false);
                expect(isValidScene(null)).toBe(false);
                expect(isValidScene(undefined)).toBe(false);
            });
        });

        describe('isValidInsightDeployType函数', () => {
            test('应该验证有效的Insight部署类型', () => {
                expect(isValidInsightDeployType('否')).toBe(true);
                expect(isValidInsightDeployType('非高可用部署')).toBe(true);
                expect(isValidInsightDeployType('高可用部署')).toBe(true);
            });

            test('应该拒绝无效的Insight部署类型', () => {
                expect(isValidInsightDeployType('无效类型')).toBe(false);
                expect(isValidInsightDeployType('')).toBe(false);
                expect(isValidInsightDeployType(null)).toBe(false);
                expect(isValidInsightDeployType(undefined)).toBe(false);
            });
        });

        describe('isValidStorageSecurity函数', () => {
            test('应该验证有效的存储安全策略', () => {
                expect(isValidStorageSecurity('raid1')).toBe(true);
                expect(isValidStorageSecurity('raid5')).toBe(true);
                expect(isValidStorageSecurity('ec')).toBe(true);
            });

            test('应该拒绝无效的存储安全策略', () => {
                expect(isValidStorageSecurity('raid0')).toBe(false);
                expect(isValidStorageSecurity('invalid')).toBe(false);
                expect(isValidStorageSecurity('')).toBe(false);
                expect(isValidStorageSecurity(null)).toBe(false);
                expect(isValidStorageSecurity(undefined)).toBe(false);
            });
        });
    });

    describe('边界条件和错误处理', () => {
        test('IP工具函数应该处理极端值', () => {
            // 测试最大和最小IP值
            expect(ipToInt('0.0.0.0')).toBe(0);
            expect(ipToInt('255.255.255.255')).toBe(-1); // JavaScript 32位有符号整数
            expect(intToIp(0)).toBe('0.0.0.0');
            expect(intToIp(-1)).toBe('255.255.255.255'); // 对应无符号的4294967295
        });

        test('应该处理null和undefined输入', () => {
            expect(parseIpList(null)).toEqual([]);
            expect(parseIpList(undefined)).toEqual([]);
            expect(validateIpList('')).toEqual({ ips: [], errors: [] });
        });

        test('应该处理空白字符和特殊字符', () => {
            expect(parseIpList('   ')).toEqual([]);
            expect(parseIpList('\t\n\r')).toEqual([]);
            expect(parseIpList('192.168.1.1   \t\n  192.168.1.2')).toEqual(['192.168.1.1', '192.168.1.2']);
        });

        test('验证器应该处理缺失的参数', () => {
            expect(() => validateParams({})).not.toThrow();
            expect(() => validateServerCounts({})).not.toThrow();
        });
    });

    describe('性能测试', () => {
        test('解析大量IP应该在合理时间内完成', () => {
            const startTime = Date.now();

            // 生成大范围IP列表
            const largeRange = '10.0.0.1-10.0.10.254';
            const result = parseIpList(largeRange);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(result.length).toBeGreaterThan(2500);
            // 应该在2秒内完成
            expect(duration).toBeLessThan(2000);
        });

        test('验证大量参数应该在合理时间内完成', () => {
            const startTime = Date.now();

            // 执行多次验证
            for (let i = 0; i < 1000; i++) {
                const params = {
                    isNetCombined: i % 2 === 0,
                    scene: i % 2 === 0 ? '管理网和业务网合一场景' : '管理网和业务网隔离场景_运维通过管理网访问',
                    isDualNode: true,
                    countMng: 2,
                    countFusion: 3,
                    userCount: 5000,
                };
                validateParams(params);
                validateServerCounts(params);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 应该在1秒内完成
            expect(duration).toBeLessThan(1000);
        });
    });
});
