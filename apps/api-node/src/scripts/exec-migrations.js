"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("node:fs");
var node_url_1 = require("node:url");
var logger_js_1 = require("./logger.js");
var connectDatabase_js_1 = require("@/utils/connectDatabase.js");
var __filename = (0, node_url_1.fileURLToPath)(import.meta.url);
var __dirname = path.dirname(__filename);
function ensureMigrationsTable() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connectDatabase_js_1.pool.query("CREATE TABLE IF NOT EXISTS migrations (\n      id SERIAL PRIMARY KEY,\n      name VARCHAR(255) NOT NULL,\n      run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n    )\n  ")];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getExecutedMigrations() {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connectDatabase_js_1.pool.query('SELECT name FROM migrations')];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.rows.map(function (r) { return r.name; })];
            }
        });
    });
}
function runMigrations() {
    return __awaiter(this, void 0, void 0, function () {
        var migrationFailed, client, migrationsDir, files, executedMigrations, _i, files_1, file, filePath, sql, err_1, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    migrationFailed = false;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 17, 18, 20]);
                    return [4 /*yield*/, ensureMigrationsTable()];
                case 2:
                    _a.sent();
                    migrationsDir = path.join(__dirname, '../migrations');
                    files = fs
                        .readdirSync(migrationsDir)
                        .filter(function (f) { return f.endsWith('.sql'); });
                    return [4 /*yield*/, getExecutedMigrations()];
                case 3:
                    executedMigrations = _a.sent();
                    _i = 0, files_1 = files;
                    _a.label = 4;
                case 4:
                    if (!(_i < files_1.length)) return [3 /*break*/, 16];
                    file = files_1[_i];
                    if (executedMigrations.includes(file)) {
                        logger_js_1.default.info("Skipping already executed migration: ".concat(file));
                        return [3 /*break*/, 15];
                    }
                    filePath = path.join(migrationsDir, file);
                    sql = fs.readFileSync(filePath, 'utf-8');
                    return [4 /*yield*/, connectDatabase_js_1.pool.connect()];
                case 5:
                    client = _a.sent();
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 11, 13, 14]);
                    return [4 /*yield*/, client.query('BEGIN')];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, client.query(sql)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, client.query('INSERT INTO migrations(name) VALUES($1)', [file])];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, client.query('COMMIT')];
                case 10:
                    _a.sent();
                    logger_js_1.default.info("Migration executed: ".concat(file));
                    return [3 /*break*/, 14];
                case 11:
                    err_1 = _a.sent();
                    return [4 /*yield*/, client.query('ROLLBACK')];
                case 12:
                    _a.sent();
                    console.error("Error running migration ".concat(file, ":"), err_1);
                    migrationFailed = true;
                    return [3 /*break*/, 16];
                case 13:
                    if (client) {
                        client.release();
                        client = null;
                    }
                    return [7 /*endfinally*/];
                case 14:
                    if (migrationFailed) {
                        return [3 /*break*/, 16];
                    }
                    _a.label = 15;
                case 15:
                    _i++;
                    return [3 /*break*/, 4];
                case 16:
                    if (!migrationFailed) {
                        logger_js_1.default.info('All migrations executed!');
                    }
                    return [3 /*break*/, 20];
                case 17:
                    err_2 = _a.sent();
                    console.error('Erro fatal ao conectar ou executar migrations:', err_2);
                    migrationFailed = true;
                    return [3 /*break*/, 20];
                case 18: return [4 /*yield*/, connectDatabase_js_1.pool.end()];
                case 19:
                    _a.sent();
                    logger_js_1.default.info('Conexão encerrada');
                    if (migrationFailed) {
                        process.exit(1);
                    }
                    else {
                        process.exit(0);
                    }
                    return [7 /*endfinally*/];
                case 20: return [2 /*return*/];
            }
        });
    });
}
runMigrations();
