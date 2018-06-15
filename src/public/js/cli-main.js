var socket = io(),//declaro el socket para la comunicacion
    stream = ss.createStream(),
    //declaro los botones para manejo mas facil
    empezar=document.getElementById('empezar'),
    guardar=document.getElementById('guardar'),
    parar=document.getElementById('parar'),
    startStream=document.getElementById('start-stream'),
    stopStream = document.getElementById('stop-stream'),
    //declaro los elementos del html para manejo mas facil
    audio = document.getElementById('audio'),//audio tag
    streaming = document.getElementById('streaming'),//audio tag
    duracion = document.getElementById('duracion'), //text tag
    //variables para funciones y uso de js
    blobArray=[],//para enviar audios
    nombre,//nombre del audio
    mediaRecorder,//el recorder para los audios
    //mediaStreamer,//el recorder para los streaming
    isStopped=false,//bandera para botones
    media={audio:true};//parametros para getusermedia
    var peer = new Peer({host: 'cloud.peer-js.com'});
    var idRemote;
    var call;
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));//funcion sleep
    //obtengo datos del microfono  varia dependiendo del navegador
    navigator.streaming=
    (   
        navigator.getUserMedia||
        navigator.webkitGetUserMedia||
        navigator.mozGetUserMedia||
        navigator.msGetUserMedia
    );
//cuando recibo mensaje del servidor lo muestro en mi area de texto

socket.on("mensaje",(data)=>
{
    document.getElementById('servidor').value+=data+"\t";
});
//cuando recibo nombre de algun audio lo reproduzco
socket.on('audio',(nombre)=>
{
    audio.src="/audios/"+nombre;
});
//cuando conecto con el peer le mando el id

socket.on('id',(id)=>
{
    idRemote=id;
    socket.emit('mensaje',"se obtuvo el peerId");
})

//jueguito con los botones y jquery
//Audio
empezar.addEventListener('click',()=>
{
    if(inputValid(duracion.value))
    {
        empezar.disabled=true;
        socket.emit("mensaje","empezo a grabar");
        navigator.streaming(media,grabar,errorGrabar);
        var isStopped=false;
    }
});
parar.addEventListener('click',()=>
{
    parar.disabled=true;
    mediaRecorder.stop();
    mediaRecorder.stream.stop();
    empezar.disabled = false;
    isStopped=true;
    socket.emit("mensaje","se paro la grabacion");
});
guardar.addEventListener('click',()=>
{
    guardar.disabled=true;
    parar.disabled=true;
    empezar.disabled=false;
    if(!isStopped)
    {
        mediaRecorder.stop();
        mediaRecorder.stream.stop();
    }
    ConcatenateBlobs(blobArray, blobArray[0].type,(result)=>
    {
        var date = new Date();
        nombre = date.toISOString().replaceAll(':','').replace(/\..+/,'')+".wav";
        socket.emit("audio",result,nombre);
        blobArray=[];
    })
    socket.emit("mensaje","se guardo la grabacion");
});
duracion.addEventListener("input",()=>
{
    duracion.value=duracion.value.replace(/\D/g,'');
});

duracion.addEventListener("paste",()=>
{
    duracion.value=duracion.value.replace(/\D/g,'');
});
//Stream
startStream.addEventListener("click",()=>
{
    startStream.disabled=true;
    stopStream.disabled=false;
    navigator.streaming(media,streamer,errorGrabar);
    
});

stopStream.addEventListener("click",()=>
{
    stopStream.disabled=true;
    startStream.disabled=false;
    call=null;
    streaming.srcObject=null;
});

//grabar audio
async function grabar(stream)
{  
    mediaRecorder = new MediaStreamRecorder(stream);
    mediaRecorder.stream = stream;
    mediaRecorder.mimeType = 'audio/wav';
    mediaRecorder.ondataavailable = function (blob) {
        blobArray.push(blob);
    };
    parar.disabled= false;
    guardar.disabled=false;
    mediaRecorder.start(parseInt(duracion.value,10)*1000);
    delay(parseInt(duracion.value,10)*1000-1)
    .then(()=>
    {
        parar.disabled=true;
        mediaRecorder.stop();
        mediaRecorder.stream.stop();
        empezar.disabled = false;
        isStopped=true;
        socket.emit("mensaje","se paro la grabacion");
    }
    );
}
// stream audio
async function streamer(stream)
{
    if(idRemote)
    {
        call = peer.call(String(idRemote),stream);
        call.on('stream',(remoteStream)=>
    {
        streaming.srcObject=remoteStream;
    })
    }else
    {
        alert('necesita conexion con el servidor');
    }
}

//funcion para String
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

//funcion validar duracion de audio
function inputValid(numero)
{
    if(numero =="")
    {
        alert("campo de duracion esta vacio");
        return false;
        
    }
    if(parseInt(numero,10)<=0)
    {
        alert("se debe colocar duracion mayor que 0");
        return false;
    }else{
        if(parseInt(numero,10)>300)
        {
            duracion.value=300;
            alert("la duracion maxima para el audio son 5 minutos");
            return false
        }else
        {
            return true;
        }
    }
}
//en caso de error
function errorGrabar(e)
{
    alert("error: "+e);
}
//concatenar blobs para audio
(function() {
    window.ConcatenateBlobs = async function(blobs, type, callback) 
    {
        var buffers = [];

        var index = 0;

        function readAsArrayBuffer() {
            if (!blobs[index]) {
                return concatenateBuffers();
            }
            var reader = new FileReader();
            reader.onload = function(event) {
                buffers.push(event.target.result);
                index++;
                readAsArrayBuffer();
            };
            reader.readAsArrayBuffer(blobs[index]);
        }

        readAsArrayBuffer();

        function concatenateBuffers() 
        {
            var byteLength = 0;
            buffers.forEach(function(buffer) {
                byteLength += buffer.byteLength;
            });

            var tmp = new Uint16Array(byteLength);
            var lastOffset = 0;
            buffers.forEach(function(buffer) {
                // BYTES_PER_ELEMENT == 2 for Uint16Array
                var reusableByteLength = buffer.byteLength;
                if (reusableByteLength % 2 != 0) {
                    buffer = buffer.slice(0, reusableByteLength - 1)
                }
                tmp.set(new Uint16Array(buffer), lastOffset);
                lastOffset += reusableByteLength;
            });

            var blob = new Blob([tmp.buffer], {
                type: type
            });

            callback(blob);
        }
        
    };
    
})();
