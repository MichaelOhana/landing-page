import { DB_FILE_PATH, SQL_JS_CDN_PATH } from './config.js';

export async function initDB() {
    try {
        console.log("Loading SQL.js WASM...");
        const SQL = await window.initSqlJs({ locateFile: file => `${SQL_JS_CDN_PATH}${file}` });

        console.log("Fetching database file:", DB_FILE_PATH);
        const dbResponse = await fetch(DB_FILE_PATH);
        if (!dbResponse.ok) {
            throw new Error(`Failed to fetch database: ${dbResponse.statusText}`);
        }
        const dbFileArrayBuffer = await dbResponse.arrayBuffer();

        console.log("Creating database instance...");
        this.db = new SQL.Database(new Uint8Array(dbFileArrayBuffer));
        console.log("Database loaded successfully.");
    } catch (err) {
        console.error("Database initialization error:", err);
        this.error = (this.error ? this.error + '; ' : '') + (err.message || "An unknown error occurred during DB initialization.");
        throw err; // Re-throw to be caught by main init
    }
}

export function executeQuery(sql, params = []) {
    if (!this.db) {
        console.error("Database not initialized.");
        this.error = "Database not initialized. Cannot execute query.";
        return null;
    }
    try {
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    } catch (e) {
        console.error("Error executing query:", sql, e);
        this.error = `Query failed: ${e.message}`;
        return null;
    }
}

// ---- Database schema helpers ----
export function checkDatabaseSchema() {
    try {
        // Check what tables exist in the database
        const tablesQuery = "SELECT name FROM sqlite_master WHERE type='table'";
        const tables = this.executeQuery(tablesQuery) || [];
        console.log('[databaseService] Available tables:', tables.map(t => t.name));

        // Check if we have a modules table
        const hasModulesTable = tables.some(t => t.name.toLowerCase() === 'modules');
        console.log('[databaseService] Has modules table:', hasModulesTable);

        // Check if we have a clips table
        const hasClipsTable = tables.some(t => t.name.toLowerCase() === 'clips');
        console.log('[databaseService] Has clips table:', hasClipsTable);

        // Log table structures for debugging
        this.logTableStructures(tables, hasClipsTable);

        return { tables, hasModulesTable, hasClipsTable };
    } catch (err) {
        console.error('[databaseService] Error checking database schema:', err);
        return { tables: [], hasModulesTable: false, hasClipsTable: false };
    }
}

export function logTableStructures(tables, hasClipsTable) {
    // Check words table structure
    if (tables.some(t => t.name.toLowerCase() === 'words')) {
        const wordsStructure = this.executeQuery("PRAGMA table_info(words)") || [];
        console.log('[databaseService] Words table structure:', wordsStructure);
    }

    // Check clips table structure if it exists
    if (hasClipsTable) {
        const clipsStructure = this.executeQuery("PRAGMA table_info(clips)") || [];
        console.log('[databaseService] Clips table structure:', clipsStructure);

        // Check how many clips are in the database
        const clipsCount = this.executeQuery("SELECT COUNT(*) as count FROM clips") || [];
        console.log('[databaseService] Total clips in database:', clipsCount[0]?.count || 0);

        this.logSampleClipsData(clipsCount);
    }
}

export function logSampleClipsData(clipsCount) {
    if (clipsCount[0]?.count > 0) {
        const sampleClips = this.executeQuery("SELECT * FROM clips LIMIT 3") || [];
        console.log('[databaseService] Sample clips:', sampleClips);

        // Show which words have clips
        const wordsWithClips = this.executeQuery(`
            SELECT w.id, w.term, COUNT(c.id) as clip_count 
            FROM words w 
            LEFT JOIN clips c ON w.id = c.word_id 
            WHERE c.id IS NOT NULL 
            GROUP BY w.id, w.term 
            ORDER BY clip_count DESC 
            LIMIT 5
        `) || [];
        console.log('[databaseService] Words with clips:', wordsWithClips);
    }
} 