// Acha rostos numa foto, só no aparelho (nada é enviado). Carregado sob demanda.
// Usa o detector nativo do navegador quando existe; se não, o modelo leve do face-api.
import * as faceapi from '@vladmandic/face-api/dist/face-api.esm.js';

let pronto = null;
function preparar(){
  if(!pronto) pronto = (async()=>{
    try{ await faceapi.tf.setBackend('webgl'); await faceapi.tf.ready(); }
    catch(e){ await faceapi.tf.setBackend('cpu'); await faceapi.tf.ready(); }
    await faceapi.nets.tinyFaceDetector.loadFromUri('/modelos');
  })().catch(e=>{ pronto = null; throw e; });
  return pronto;
}

// img: canvas ou ImageBitmap. Devolve caixas em frações da imagem: [{x,y,w,h}]
export async function acharRostos(img){
  const iw = img.width, ih = img.height;
  const lado = 960, s = Math.min(1, lado/Math.max(iw, ih));
  const c = document.createElement('canvas'); c.width = Math.round(iw*s); c.height = Math.round(ih*s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  if('FaceDetector' in window){
    try{
      const r = await new window.FaceDetector({ fastMode:true, maxDetectedFaces:6 }).detect(c);
      if(r && r.length) return r.map(f=>({ x:f.boundingBox.x/c.width, y:f.boundingBox.y/c.height, w:f.boundingBox.width/c.width, h:f.boundingBox.height/c.height }));
    }catch(e){}
  }
  await preparar();
  const achar = async (cv, tam)=>(await faceapi.detectAllFaces(cv, new faceapi.TinyFaceDetectorOptions({ inputSize:tam, scoreThreshold:0.45 })))
    .map(d=>({ x:d.box.x, y:d.box.y, w:d.box.width, h:d.box.height }));
  let caixas = await achar(c, 512);
  if(!caixas.length){
    // rostos pequenos (foto de corpo inteiro): procura em pedaços quadrados ao longo da foto
    const L = Math.min(c.width, c.height), passo = L/2, t = document.createElement('canvas'); t.width = t.height = L;
    const tx = t.getContext('2d');
    for(let y = 0; y + L <= c.height + 1; y += passo) for(let x = 0; x + L <= c.width + 1; x += passo){
      tx.drawImage(c, x, y, L, L, 0, 0, L, L);
      (await achar(t, 416)).forEach(b=>caixas.push({ x:b.x + x, y:b.y + y, w:b.w, h:b.h }));
    }
    const iou = (a, b)=>{ const w = Math.min(a.x+a.w, b.x+b.w) - Math.max(a.x, b.x), h = Math.min(a.y+a.h, b.y+b.h) - Math.max(a.y, b.y); return w>0 && h>0 ? w*h/Math.min(a.w*a.h, b.w*b.h) : 0; };
    caixas = caixas.filter((a, i)=>!caixas.some((b, j)=>j<i && iou(a, b)>0.4));
  }
  return caixas.map(d=>({ x:d.x/c.width, y:d.y/c.height, w:d.w/c.width, h:d.h/c.height }));
}
