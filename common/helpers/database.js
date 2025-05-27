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
        this.db.prepare('CREATE TABLE IF NOT EXISTS email2fa(' +
            '  code INTEGER PRIMARY KEY NOT NULL,' +
            '  userId INTEGER NOT NULL,' +
            '  validFrom INTEGER NOT NULL,' +
            '  validTill INTEGER NOT NULL' +
            ');').run();
    }

    /**
     * Gets the user ID from the database, provided the username is valid.
     * @param username {String} The string username to look up in the database.
     * @returns {int|null} The ID for the user.
     */
    get_user(username) {
        const statement = this.db.prepare('SELECT id FROM users WHERE username = ?');
        let val =  statement.get(username);
        if(!val) return null;
        return val.id;
    }

    /**
     * Checks to see if the user exists in the database or not.
     * @param userId
     * @returns {boolean}
     */
    user_exists(userId) {
        const statement = this.db.prepare('SELECT * FROM users WHERE id = ?');
        let val = statement.get(userId);
        return !!val;

    }

    /**
     * Gets the current Two Factor status for an account with its user ID.
     * @param userId {int} The numeric ID for the account.
     * @returns {boolean} The status of the account having TFA.
     */
    get_tfa_status(userId) {
        const statement = this.db.prepare('SELECT tfa_enabled FROM users WHERE id = ?');
        let val = statement.get(userId);
        if(!val) return false;
        return !!val.tfa_enabled;
    }

    /**
     * Gets the current Two Factor Method for an account with its user ID.
     * @param userId {int} The numeric ID for the account.
     * @returns {String|null} The method for Two-Factor Authentication, or null if there isn't one enabled for the account.
     */
    get_tfa_method(userId) {
        const statement = this.db.prepare('SELECT tfa_enabled, tfa_method FROM users WHERE id = ?');
        let val = statement.get(userId);

        if(!val) return null;
        if(!val.tfa_enabled) return null;
        return val.tfa_method;
    }

    get_tfa_secret(userId) {
        const statement = this.db.prepare('SELECT tfa_enabled, tfa_secret FROM users WHERE id = ?');
        let val = statement.get(userId);

        if(!val) return null;
        if(!val.tfa_enabled) return null;
        if(!val.tfa_secret) return null;
        return val.tfa_secret;
    }

    check_email_tfa_code(code, userId) {
        const statement = this.db.prepare('SELECT * FROM email2fa WHERE code = ? AND userId = ?');
        let val = statement.get(code, userId);

        if(!val) return null;
        const now = Date.now();
        if(Number(val.validFrom) > now) return false;
        if(Number(val.validTill) < now) return false;
        return true;
    }

    /**
     * Checks if the user's password is valid.
     * @param userId {int} The numeric ID for the account.
     * @param password {String} The provided password for the account.
     * @returns {Promise<boolean>} The status of the password being valid.
     */
    async check_user_password(userId, password) {
        const statement = this.db.prepare('SELECT password FROM users WHERE id = ?');
        const val = await statement.get(userId);

        // Check that a value has been provided.
        if(!val) return false;

        // Check the hash of the user password.
        return await bcrypt.compare(password, val.password)
    }


}
