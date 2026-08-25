import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
export const AUTH_COOKIE='hlaqti_session';
export type AuthRole='CLIENT'|'COIFFEUR'|'SUPER_ADMIN';
export type AuthSession={sub:string;phone:string;name:string;role:AuthRole;status:'ACTIF'|'EN_ATTENTE'};
const secret=new TextEncoder().encode(process.env.AUTH_SECRET||'hlaqti-dev-secret-change-me-before-production');
export async function createSessionToken(user:AuthSession){return new SignJWT({...user}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('30d').sign(secret)}
export async function readSessionToken(token?:string|null):Promise<AuthSession|null>{if(!token)return null;try{const{payload}=await jwtVerify(token,secret);return{sub:String(payload.sub),phone:String(payload.phone),name:String(payload.name),role:payload.role as AuthRole,status:payload.status as AuthSession['status']}}catch{return null}}
export const sessionCookieOptions={httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*30};
