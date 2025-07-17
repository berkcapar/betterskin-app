import * as SQLite from 'expo-sqlite';
import { AnalysisResult, DatabaseAnalysis } from '@/types';

const DB_NAME = 'face_analysis.db';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        imageUri TEXT NOT NULL,
        oiliness INTEGER NOT NULL,
        redness INTEGER NOT NULL,
        texture TEXT NOT NULL,
        acne TEXT,
        advice TEXT NOT NULL,
        routines TEXT
      );
    `;

    await this.db.execAsync(createTableQuery);
  }

  async saveAnalysis(result: AnalysisResult): Promise<void> {
    if (!this.db) await this.init();

    const query = `
      INSERT OR REPLACE INTO analyses 
      (id, timestamp, imageUri, oiliness, redness, texture, acne, advice, routines)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      result.id,
      result.timestamp,
      result.imageUri,
      result.metrics.oiliness,
      result.metrics.redness,
      result.metrics.texture,
      result.metrics.acne || null,
      JSON.stringify(result.advice),
      result.routines ? JSON.stringify(result.routines) : null,
    ];

    await this.db!.runAsync(query, values);
    
    // Keep only last 3 analyses for free users
    await this.cleanupOldAnalyses();
  }

  async getAnalysisHistory(): Promise<AnalysisResult[]> {
    if (!this.db) await this.init();

    const query = `
      SELECT * FROM analyses 
      ORDER BY timestamp DESC 
      LIMIT 3
    `;

    const rows = await this.db!.getAllAsync(query) as DatabaseAnalysis[];
    
    return rows.map(this.mapDatabaseToResult);
  }

  async getAnalysisById(id: string): Promise<AnalysisResult | null> {
    if (!this.db) await this.init();

    const query = 'SELECT * FROM analyses WHERE id = ? LIMIT 1';
    const row = await this.db!.getFirstAsync(query, [id]) as DatabaseAnalysis | null;
    
    return row ? this.mapDatabaseToResult(row) : null;
  }

  private async cleanupOldAnalyses(): Promise<void> {
    if (!this.db) return;

    const deleteQuery = `
      DELETE FROM analyses 
      WHERE id NOT IN (
        SELECT id FROM analyses 
        ORDER BY timestamp DESC 
        LIMIT 3
      )
    `;

    await this.db.runAsync(deleteQuery);
  }

  private mapDatabaseToResult(row: DatabaseAnalysis): AnalysisResult {
    return {
      id: row.id,
      timestamp: row.timestamp,
      imageUri: row.imageUri,
      metrics: {
        oiliness: row.oiliness,
        redness: row.redness,
        texture: row.texture as 'good' | 'medium' | 'poor',
        acne: row.acne as 'low' | 'medium' | 'high' | undefined,
      },
      advice: JSON.parse(row.advice),
      routines: row.routines ? JSON.parse(row.routines) : undefined,
    };
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.runAsync('DELETE FROM analyses');
  }
}

export const database = new DatabaseService(); 