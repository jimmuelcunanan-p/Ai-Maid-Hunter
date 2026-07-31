export async function api<T=any>(path:string,options:RequestInit={}):Promise<T>{
 const res=await fetch(`/api${path}`,{...options,credentials:"include",headers:{"Content-Type":"application/json",...options.headers}});
 const raw=res.status===204?"":await res.text();
 let data:any=null;
 if(raw){
  try{data=JSON.parse(raw)}
  catch{data={error:raw}}
 }
 if(!res.ok)throw new Error(data?.error||`Request failed (${res.status})`);
 return data as T;
}
