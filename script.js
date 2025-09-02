const $=id=>document.getElementById(id);

function formatRp(n){
  return 'Rp '+n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");
}

function parseItems(text){
  return text.split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{
    let [name, qty, price] = l.split(";").map(v=>v.trim());
    return {name, qty: Number(qty||1), price: Number(price||0)};
  });
}

function render(){
  $("rMerchant").textContent = $("merchantName").value;
  $("rAddress").textContent = $("address").value;
  $("rTxn").textContent = $("txnId").value;
  $("rDate").textContent = $("date").value;
  $("rCustomer").textContent = $("customer").value;
  $("rThankYou").textContent = $("thankYou").value;
  $("rPoweredBy").textContent = $("poweredBy").value;

  const items = parseItems($("itemsInput").value);
  const container = $("rItems");
  container.innerHTML = '';
  let subtotal = 0;

  items.forEach(it=>{
    let row = document.createElement("div");
    row.className = "item";
    let total = it.qty * it.price;
    subtotal += total;
    row.innerHTML = `<div>${it.name} x${it.qty}</div><div>${formatRp(total)}</div>`;
    container.appendChild(row);
  });

  $("rSubtotal").textContent = formatRp(subtotal);
  $("rDiscount").textContent = formatRp(0);
  $("rTotal").textContent = formatRp(subtotal);
}

// ID Transaksi otomatis + reset harian
function generateTxnId(){
  let now = new Date();
  let y = now.getFullYear(),
      m = String(now.getMonth()+1).padStart(2,"0"),
      d = String(now.getDate()).padStart(2,"0");

  let todayKey = y + m + d;
  let lastDate = localStorage.getItem("txnLastDate");

  if(lastDate !== todayKey){
    localStorage.setItem("txnCounter","0");
    localStorage.setItem("txnLastDate", todayKey);
  }

  let count = Number(localStorage.getItem("txnCounter") || 0) + 1;
  localStorage.setItem("txnCounter", count);

  return `TRX-${y}${m}${d}-${String(count).padStart(3,"0")}`;
}

window.addEventListener("DOMContentLoaded", ()=>{
  $("txnId").value = generateTxnId();
  $("date").value = new Date().toISOString().slice(0,16).replace("T"," ");
  render();
});

$("renderBtn").addEventListener("click", ()=>{
  render();
  let el = $("receipt");
  el.style.transform = "scale(.97)";
  setTimeout(()=>el.style.transform="scale(1)",180);
});

// Download PNG, PDF, Share, Print
async function downloadPNG(){
  const el = $("receipt");
  const canvas = await html2canvas(el,{scale:2, backgroundColor:null});
  const data = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = data;
  a.download = $("txnId").value+".png";
  document.body.appendChild(a); a.click(); a.remove();
}

async function downloadPDF(){
  const el = $("receipt");
  const canvas = await html2canvas(el,{scale:2});
  const imgData = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({unit:'px', format:[canvas.width, canvas.height]});
  pdf.addImage(imgData,'PNG',0,0,canvas.width,canvas.height);
  pdf.save($("txnId").value+".pdf");
}

async function shareFile(){
  if(!navigator.canShare || !navigator.share){
    alert("Fitur share tidak didukung");
    return;
  }
  const el = $("receipt");
  const canvas = await html2canvas(el,{scale:2});
  const blob = await new Promise(res=>canvas.toBlob(res,"image/png"));
  const file = new File([blob], $("txnId").value+".png",{type:"image/png"});
  if(navigator.canShare({files:[file]})){
    await navigator.share({files:[file], title:$("merchantName").value, text:"Struk pembayaran"});
  } else {
    alert("Browser tidak mendukung berbagi file");
  }
}

$("pngBtn").addEventListener("click", downloadPNG);
$("pdfBtn").addEventListener("click", downloadPDF);
$("shareBtn").addEventListener("click", shareFile);
$("printBtn").addEventListener("click", ()=>window.print());
