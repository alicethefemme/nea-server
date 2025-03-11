use sqlx::{Error, Executor, Pool, Row, Sqlite, SqlitePool};

#[derive(Clone)]
pub struct DB {
    pool_connection: Pool<Sqlite>
}

impl DB {
    /// Create the database pool for connecting to and executing instructions on the database.
    pub async fn create_pool(db_path: &str) -> Result<DB, Error> {
        // Create a database file if it doesn't exist.
        match tokio::fs::File::create(db_path).await {
            Ok(_) => {
                // Connect to the database and create a pool.
                match SqlitePool::connect(&format!("sqlite://{}", db_path)).await {
                    Ok(pool) => {
                        // Return the pool.
                        Ok(DB {
                            pool_connection: pool
                        })
                    }
                    Err(e) => {Err(e)}
                }
            }
            Err(e) => {return Err(Error::from(e))}
        }
    }

    /// Create the tables that the database requires for the server to function.
    pub async fn create_default_tables(&self) -> Result<bool, Error>{
        let qry = "\
        PRAGMA foreign_keys = ON;\
        CREATE TABLE IF NOT EXISTS users\
        (\
            user_id     INTEGER PRIMARY KEY NOT NULL,\
            username    TEXT                NOT NULL,\
            password    TEXT                NOT NULL,\
            tfa_enabled BOOLEAN             NOT NULL DEFAULT 0\
        );";

        // Run the query in the database.
        match sqlx::query(&qry).execute(&self.pool_connection).await {
            Ok(r) => {Ok(true)}
            Err(e) => {Err(e)}
        }
    }

    /// Check the status for the Two-Factor Auth for a user based on their username.
    pub async fn get_tfa_status(&self, username: String) -> Result<bool, Error> {
        let qry = "SELECT tfa_enabled FROM users WHERE username = $1";
        let stream = sqlx::query(qry)
            .bind(username)
            .fetch_one(&self.pool_connection)
            .await?;

        let is_tfa: bool = stream.get(0);
        Ok(is_tfa)
    }
}