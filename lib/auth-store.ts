import { createHash,randomUUID } from 'crypto';import { DatabaseSync } from 'node:sqlite';import { mkdirSync } from 'fs';import { join } from 'path';import type { AuthRole,AuthSession } from './auth';
type User=AuthSession&{createdAt:string};
const dataDir=join(process.cwd(),'.data');mkdirSync(dataDir,{recursive:true});
const globalDb=globalThis as typeof globalThis&{hlaqtiAuthDb?:DatabaseSync};
const db=globalDb.hlaqtiAuthDb??(globalDb.hlaqtiAuthDb=new DatabaseSync(join(dataDir,'hlaqti.sqlite')));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS auth_users(id TEXT PRIMARY KEY,phone TEXT NOT NULL UNIQUE,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('CLIENT','COIFFEUR','SUPER_ADMIN')),status TEXT NOT NULL CHECK(status IN ('ACTIF','EN_ATTENTE','SUSPENDU','BANNI','REFUSE')),created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS auth_otps(phone TEXT PRIMARY KEY,code_hash TEXT NOT NULL,expires_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS auth_events(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT,action TEXT NOT NULL,ip TEXT,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS oauth_accounts(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT NOT NULL,provider TEXT NOT NULL,provider_account_id TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(provider,provider_account_id));`);
// Migrate an auth_users table that was created with the old (narrower) status CHECK.
try {
  const sql = (db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='auth_users'").get() as any)?.sql || '';
  if (sql.includes("'ACTIF','EN_ATTENTE')")) {
    db.exec(`
      CREATE TABLE auth_users_new(
        id TEXT PRIMARY KEY,phone TEXT NOT NULL UNIQUE,name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('CLIENT','COIFFEUR','SUPER_ADMIN')),
        status TEXT NOT NULL CHECK(status IN ('ACTIF','EN_ATTENTE','SUSPENDU','BANNI','REFUSE')),
        created_at TEXT NOT NULL
      );
      INSERT INTO auth_users_new(id,phone,name,role,status,created_at) SELECT id,phone,name,role,status,created_at FROM auth_users;
      DROP TABLE auth_users;
      ALTER TABLE auth_users_new RENAME TO auth_users;
    `);
  }
} catch { /* non-fatal migration */ }
const columns=new Set((db.prepare('PRAGMA table_info(auth_users)').all() as any[]).map(x=>x.name));for(const [name,type] of [['email','TEXT'],['locale',"TEXT NOT NULL DEFAULT 'fr'"],['cut_preferences','TEXT'],['avatar_url','TEXT'],['birth_year','INTEGER'],['gender','TEXT'],['first_name','TEXT'],['last_name','TEXT'],['city','TEXT'],['neighborhood','TEXT'],['newsletter','INTEGER NOT NULL DEFAULT 0'],['completed_at','TEXT']] as const){if(!columns.has(name))db.exec(`ALTER TABLE auth_users ADD COLUMN ${name} ${type}`)}
const seed=db.prepare('INSERT OR IGNORE INTO auth_users(id,phone,name,role,status,created_at) VALUES(?,?,?,?,?,?)');const now=new Date().toISOString();seed.run('client-youssef','+212612345678','Youssef Bennani','CLIENT','ACTIF',now);seed.run('barber-karim','+212611111111','Karim B.','COIFFEUR','ACTIF',now);seed.run('admin-mourad','+212600000001','Mourad Ghazi','SUPER_ADMIN','ACTIF',now);
export function normalizePhone(raw:string){const digits=raw.replace(/\D/g,'');if(/^0[5-7]\d{8}$/.test(digits))return'+212'+digits.slice(1);if(/^212[5-7]\d{8}$/.test(digits))return'+'+digits;if(/^[5-7]\d{8}$/.test(digits))return'+212'+digits;return raw.startsWith('+')?raw:'+'+digits}
const digest=(phone:string,code:string)=>createHash('sha256').update(`${phone}:${code}:${process.env.OTP_PEPPER||'dev-pepper'}`).digest('hex');
export function issueOtp(phone:string){const code=process.env.NODE_ENV==='production'?String(Math.floor(100000+Math.random()*900000)):'123456';db.prepare(`INSERT INTO auth_otps(phone,code_hash,expires_at,attempts) VALUES(?,?,?,0) ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0`).run(phone,digest(phone,code),Date.now()+5*60_000);return code}
export function consumeOtp(phone:string,code:string){const otp=db.prepare('SELECT code_hash,expires_at,attempts FROM auth_otps WHERE phone=?').get(phone) as {code_hash:string;expires_at:number;attempts:number}|undefined;if(!otp||otp.expires_at<Date.now()){db.prepare('DELETE FROM auth_otps WHERE phone=?').run(phone);return{ok:false,error:'CODE_EXPIRE'} as const}if(otp.attempts>=3)return{ok:false,error:'TROP_DE_TENTATIVES'} as const;db.prepare('UPDATE auth_otps SET attempts=attempts+1 WHERE phone=?').run(phone);if(otp.code_hash!==digest(phone,code))return{ok:false,error:'CODE_INCORRECT'} as const;db.prepare('DELETE FROM auth_otps WHERE phone=?').run(phone);return{ok:true} as const}
function rowToUser(row:any):User{return{sub:row.id,phone:row.phone,name:row.name,role:row.role,status:row.status,createdAt:row.created_at}}
export function findOrCreateUser(phone:string,role:AuthRole,name?:string){const existing=db.prepare('SELECT * FROM auth_users WHERE phone=?').get(phone);if(existing){const user=rowToUser(existing);if(user.role!==role)return{error:'ROLE_INCORRECT',user} as const;db.prepare('INSERT INTO auth_events(user_id,action,created_at) VALUES(?,?,?)').run(user.sub,'LOGIN_OTP',new Date().toISOString());return{user} as const}const user:User={sub:randomUUID(),phone,name:name?.trim()||'Nouveau membre',role,status:role==='COIFFEUR'?'EN_ATTENTE':'ACTIF',createdAt:new Date().toISOString()};db.prepare('INSERT INTO auth_users(id,phone,name,role,status,created_at) VALUES(?,?,?,?,?,?)').run(user.sub,user.phone,user.name,user.role,user.status,user.createdAt);db.prepare('INSERT INTO auth_events(user_id,action,created_at) VALUES(?,?,?)').run(user.sub,'ACCOUNT_CREATED',new Date().toISOString());return{user} as const}

export type RegistrationInput = {
  phone: string;
  role: AuthRole;
  firstName: string;
  lastName: string;
  email?: string;
  gender?: string;
  birthYear?: number | null;
  city?: string;
  neighborhood?: string;
  locale?: string;
  cutPreferences?: string;
  newsletter?: boolean;
};

export function activateCoiffeurForApplication(app: {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  salon_name: string;
}) {
  const existing = db.prepare('SELECT * FROM auth_users WHERE phone=?').get(app.phone);
  if (existing) {
    const row = existing as any;
    if (row.role !== 'COIFFEUR') {
      throw new Error('PHONE_USED_BY_OTHER_ROLE');
    }
    db.prepare("UPDATE auth_users SET status='ACTIF', name=COALESCE(NULLIF(name,''),?), updated_at=? WHERE id=?")
      .run(`${app.first_name} ${app.last_name}`.trim(), new Date().toISOString(), row.id);
    db.prepare('UPDATE partner_applications SET user_id=?, updated_at=? WHERE id=?')
      .run(row.id, new Date().toISOString(), app.id);
    return rowToUser(db.prepare('SELECT * FROM auth_users WHERE id=?').get(row.id));
  }
  const id = randomUUID();
  const ts = new Date().toISOString();
  const name = `${app.first_name} ${app.last_name}`.trim();
  db.prepare(
    `INSERT INTO auth_users (id,phone,name,first_name,last_name,role,status,created_at,completed_at)
     VALUES (?,?,?,?,?, 'COIFFEUR','ACTIF',?,?)`
  ).run(id, app.phone, name, app.first_name, app.last_name, ts, ts);
  db.prepare('INSERT INTO auth_events(user_id,action,created_at) VALUES(?,?,?)').run(id, 'COIFFEUR_ACTIVATED', ts);
  db.prepare('UPDATE partner_applications SET user_id=?, updated_at=? WHERE id=?').run(id, ts, app.id);
  return rowToUser(db.prepare('SELECT * FROM auth_users WHERE id=?').get(id));
}

export function registerUser(input: RegistrationInput) {
  const existing = db.prepare('SELECT * FROM auth_users WHERE phone=?').get(input.phone);
  if (existing) {
    const user = rowToUser(existing);
    if (user.role !== input.role) return { error: 'ROLE_INCORRECT', user } as const;
    return { user, existed: true } as const;
  }
  const id = randomUUID();
  const ts = new Date().toISOString();
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const status = input.role === 'COIFFEUR' ? 'EN_ATTENTE' : 'ACTIF';
  db.prepare(
    `INSERT INTO auth_users
      (id,phone,name,first_name,last_name,email,gender,birth_year,city,neighborhood,locale,cut_preferences,newsletter,role,status,created_at,completed_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id, input.phone, fullName, input.firstName, input.lastName, input.email || null,
    input.gender || null, input.birthYear || null, input.city || null, input.neighborhood || null,
    input.locale || 'fr', input.cutPreferences || null, input.newsletter ? 1 : 0,
    input.role, status, ts, ts
  );
  db.prepare('INSERT INTO auth_events(user_id,action,created_at) VALUES(?,?,?)').run(id, 'ACCOUNT_REGISTERED', ts);
  return { user: rowToUser(db.prepare('SELECT * FROM auth_users WHERE id=?').get(id)), existed: false } as const;
}
export function findOrCreateOAuthUser(provider:'google'|'facebook'|'apple',role:AuthRole='CLIENT'){const providerId=`${provider}-demo-user`;const linked=db.prepare('SELECT u.* FROM oauth_accounts o JOIN auth_users u ON u.id=o.user_id WHERE o.provider=? AND o.provider_account_id=?').get(provider,providerId);if(linked)return rowToUser(linked);const names={google:'Yassine Google',facebook:'Amine Facebook',apple:'Utilisateur Apple'};const id=randomUUID(),phone=`oauth:${provider}:${providerId}`,status=role==='COIFFEUR'?'EN_ATTENTE':'ACTIF';db.prepare('INSERT INTO auth_users(id,phone,name,role,status,created_at,email,avatar_url) VALUES(?,?,?,?,?,?,?,?)').run(id,phone,names[provider],role,status,new Date().toISOString(),`${provider}.demo@hlaqti.ma`,null);db.prepare('INSERT INTO oauth_accounts(user_id,provider,provider_account_id,created_at) VALUES(?,?,?,?)').run(id,provider,providerId,new Date().toISOString());return rowToUser(db.prepare('SELECT * FROM auth_users WHERE id=?').get(id))}

/** Create or link a user from a REAL OAuth profile returned by the provider. */
export function findOrCreateOAuthUserByProfile(
  provider: 'google' | 'facebook' | 'apple',
  role: AuthRole,
  profile: { providerAccountId: string; name: string; email: string | null; avatar: string | null },
) {
  const linked = db
    .prepare('SELECT u.* FROM oauth_accounts o JOIN auth_users u ON u.id=o.user_id WHERE o.provider=? AND o.provider_account_id=?')
    .get(provider, profile.providerAccountId) as any;
  if (linked) {
    db.prepare('INSERT INTO auth_events(user_id,action,created_at) VALUES(?,?,?)').run(linked.id, `LOGIN_OAUTH_${provider.toUpperCase()}`, new Date().toISOString());
    return rowToUser(linked);
  }
  const id = randomUUID();
  const ts = new Date().toISOString();
  const phone = `oauth:${provider}:${profile.providerAccountId}`;
  const status = role === 'COIFFEUR' ? 'EN_ATTENTE' : 'ACTIF';
  db.prepare('INSERT INTO auth_users(id,phone,name,role,status,created_at,email,avatar_url) VALUES(?,?,?,?,?,?,?,?)')
    .run(id, phone, profile.name, role, status, ts, profile.email, profile.avatar);
  db.prepare('INSERT INTO oauth_accounts(user_id,provider,provider_account_id,created_at) VALUES(?,?,?,?)')
    .run(id, provider, profile.providerAccountId, ts);
  db.prepare('INSERT INTO auth_events(user_id,action,created_at) VALUES(?,?,?)').run(id, `ACCOUNT_OAUTH_${provider.toUpperCase()}`, ts);
  return rowToUser(db.prepare('SELECT * FROM auth_users WHERE id=?').get(id));
}
export function getProfile(userId:string){return db.prepare('SELECT id,name,phone,email,role,status,locale,cut_preferences,avatar_url,birth_year,gender,created_at FROM auth_users WHERE id=?').get(userId) as any}

// ---------- Admin user management ----------
function adminRow(r:any){return{id:r.id,name:r.name,phone:r.phone,email:r.email,role:r.role,status:r.status,locale:r.locale,avatarUrl:r.avatar_url,birthYear:r.birth_year,gender:r.gender,cutPreferences:r.cut_preferences,createdAt:r.created_at,lastLoginAt:r.last_login_at||null,reliability:r.reliability}}
export function listUsers(filter?:{q?:string;role?:string;status?:string}){
  ensureAdminCols();
  let sql='SELECT * FROM auth_users WHERE 1=1';const args:any[]=[];
  if(filter?.role&&filter.role!=='TOUS'){sql+=' AND role=?';args.push(filter.role)}
  if(filter?.status&&filter.status!=='TOUS'){sql+=' AND status=?';args.push(filter.status)}
  if(filter?.q){sql+=' AND (lower(name) LIKE ? OR lower(phone) LIKE ? OR lower(COALESCE(email,\'\')) LIKE ?)';const q=`%${filter.q.toLowerCase()}%`;args.push(q,q,q)}
  sql+=' ORDER BY created_at DESC LIMIT 500';
  return (db.prepare(sql).all(...args) as any[]).map(adminRow)
}
export function getUserForAdmin(id:string){const row=db.prepare('SELECT * FROM auth_users WHERE id=?').get(id);return row?adminRow(row):null}
export function setUserStatus(id:string,status:AuthSession['status']|'SUSPENDU'|'BANNI'|'REFUSE'){
  ensureAdminCols();
  if(id==='admin-mourad'&&status!=='ACTIF')throw new Error('PROTECTED_SUPER_ADMIN');
  db.prepare('UPDATE auth_users SET status=?,updated_at=? WHERE id=?').run(status,new Date().toISOString(),id);
  return getUserForAdmin(id)
}
export function setUserRole(id:string,role:AuthRole){
  ensureAdminCols();
  if(id==='admin-mourad')throw new Error('PROTECTED_SUPER_ADMIN');
  db.prepare('UPDATE auth_users SET role=?,updated_at=? WHERE id=?').run(role,new Date().toISOString(),id);
  return getUserForAdmin(id)
}
let adminColsEnsured=false;
function ensureAdminCols(){
  if(adminColsEnsured)return;
  const cols=new Set((db.prepare('PRAGMA table_info(auth_users)').all() as any[]).map(x=>x.name));
  for(const [name,type] of [['updated_at','TEXT'],['last_login_at','TEXT'],['reliability',"REAL NOT NULL DEFAULT 100"]] as const){
    if(!cols.has(name))db.exec(`ALTER TABLE auth_users ADD COLUMN ${name} ${type}`)
  }
  adminColsEnsured=true;
}
export function updateProfile(userId:string,input:{name:string;email?:string;locale:string;cutPreferences?:string;birthYear?:number|null;gender?:string}){db.prepare('UPDATE auth_users SET name=?,email=?,locale=?,cut_preferences=?,birth_year=?,gender=? WHERE id=?').run(input.name,input.email||null,input.locale,input.cutPreferences||null,input.birthYear||null,input.gender||null,userId);db.prepare('INSERT INTO auth_events(user_id,action,created_at) VALUES(?,?,?)').run(userId,'PROFILE_UPDATED',new Date().toISOString());return getProfile(userId)}
