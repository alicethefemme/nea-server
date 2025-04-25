const Config = require('./config');
const Databasee = require('better-sqlite3');

const bcrypt = require('bcrypt');

module.exports = class MyDatabase {
    db;


    constructor() {
        const thisConfig = new Config();
        this.db = new Databasee(thisConfig.databasePath);

        this.db.prepare('CREATE TABLE IF NOT EXISTS users(' +
            '  id INTEGER PRIMARY KEY AUTOINCREMENT,' +
            '  username TEXT UNIQUE,' +
            '  password TEXT,' +
            '  tfa_protected BOOL,' +
            '  tfa_method TEXT,' +
            '  tfa_secret TEXT' +
            ');').run();
    }

    get_user(username) {
        const statement = this.db.prepare('SELECT * FROM users WHERE username = ?');
        return statement.get(username);
    }

    get_tfa_status(userId) {
        const statement = this.db.prepare('SELECT tfa_protected FROM users WHERE id = ?');
        return !!statement.get(userId);
    }

    check_user_password(userId, password) {
        const statement = this.db.prepare('SELECT password FROM users WHERE id = ?');
        const val = statement.get(userId);

        if(val === undefined) return false;

        // Hash the user password.
        return bcrypt.compare(password, val.password).then(result => {
            return result;
        });
    }


}
