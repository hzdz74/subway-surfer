import { STORAGE_KEY } from '../constants';

export type DinoId = 'baby-trex' | 'baby-triceratops' | 'baby-velociraptor' | 'baby-spinosaurus';

export interface SaveData {
  highscore: number;
  totalBones: number;
  unlocked: DinoId[];
  equipped: DinoId;
}

const DEFAULT_SAVE: SaveData = {
  highscore: 0,
  totalBones: 0,
  unlocked: ['baby-trex'],
  equipped: 'baby-trex',
};

export class Storage {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        highscore: Math.max(0, Number(parsed.highscore) || 0),
        totalBones: Math.max(0, Number(parsed.totalBones) || 0),
        unlocked: Array.isArray(parsed.unlocked) && parsed.unlocked.length
          ? (parsed.unlocked as DinoId[])
          : [...DEFAULT_SAVE.unlocked],
        equipped: (parsed.equipped as DinoId) || DEFAULT_SAVE.equipped,
      };
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      /* quota or privacy mode */
    }
  }

  get(): Readonly<SaveData> {
    return this.data;
  }

  addBones(n: number): void {
    this.data.totalBones += n;
    this.save();
  }

  spendBones(n: number): boolean {
    if (this.data.totalBones < n) return false;
    this.data.totalBones -= n;
    this.save();
    return true;
  }

  unlock(id: DinoId): void {
    if (!this.data.unlocked.includes(id)) {
      this.data.unlocked.push(id);
      this.save();
    }
  }

  equip(id: DinoId): void {
    if (this.data.unlocked.includes(id)) {
      this.data.equipped = id;
      this.save();
    }
  }

  setHighscoreIfBetter(score: number): boolean {
    if (score > this.data.highscore) {
      this.data.highscore = score;
      this.save();
      return true;
    }
    return false;
  }
}
