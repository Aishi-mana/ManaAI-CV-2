export default function ExportNotice({status,path}:{status:string;path:string}){
 if(!status&&!path)return null;
 const filename=path.split(/[\\/]/).pop();
 return <span className="export-notice" role="status" title={path||undefined}>{path?`Saved: ${filename}`:status}</span>;
}
