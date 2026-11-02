module.exports=async function imageProxy(req,res){
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).end("Method not allowed")}
  try{
    const input=String(req.query.url||"");
    if(input.length>700)return res.status(400).end("Invalid image");
    const url=new URL(input);
    const hosts=new Set(["catalogoson.com.br","www.catalogoson.com.br"]);
    if(url.protocol!=="https:"||!hosts.has(url.hostname)||!url.pathname.startsWith("/catalogo/")||url.username||url.password||url.port)return res.status(400).end("Invalid image");
    const upstream=await fetch(url.toString(),{redirect:"error",headers:{"User-Agent":"MomentsParisClientCatalog/1.0","Accept":"image/*"},signal:AbortSignal.timeout(10000)});
    if(!upstream.ok)return res.status(502).end("Image unavailable");
    const mime=(upstream.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
    if(!["image/jpeg","image/png","image/webp"].includes(mime))return res.status(415).end("Unsupported image");
    const len=Number(upstream.headers.get("content-length")||0);
    if(len>3000000)return res.status(413).end("Image too large");
    const bytes=new Uint8Array(await upstream.arrayBuffer());
    if(bytes.byteLength>3000000)return res.status(413).end("Image too large");
    res.setHeader("Content-Type",mime);
    res.setHeader("Cache-Control","public, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("X-Content-Type-Options","nosniff");
    return res.status(200).send(Buffer.from(bytes));
  }catch(e){return res.status(502).end("Image temporarily unavailable")}
};
