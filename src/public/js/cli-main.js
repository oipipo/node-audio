var 
//SOCKET
socket = io(),
//BOTONES
empezar=document.getElementById('empezar'),
guardar=document.getElementById('guardar'),
parar=document.getElementById('parar'),
startStream=document.getElementById('start-stream'),
stopStream = document.getElementById('stop-stream'),
//TAGS
streaming = document.getElementById('streaming'),//audio tag
duracion = document.getElementById('duracion'), //text tag
conectado = document.getElementById('conectado'), //text tag
//VARIABLES
//AUDIOS
blobArray=[],
nombre,
mediaRecorder,
isStopped=false,
media={audio:true,video:false};
//STREAMING
const peer = new Peer({host: location.hostname, port: location.port|| (location.protocol === 'https:' ? 3001 : 3000),  path: '/peerjs', });
var idRemote;
//SLEEP FUNCTION
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
//GET USER MEDIA 
navigator.streaming=
(   
    navigator.getUserMedia||
    navigator.webkitGetUserMedia||
    navigator.mozGetUserMedia||
    navigator.msGetUserMedia
);
conectado.style.backgroundColor='red';

    socket.on('id',(id)=>
    {
        idRemote=id;
        conectado.style.backgroundColor='green';
    });

//BOTONES AUDIO
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
    groupAndSend();
});
duracion.addEventListener("input",()=>
{
    duracion.value=duracion.value.replace(/\D/g,'');
});
duracion.addEventListener("paste",()=>
{
    duracion.value=duracion.value.replace(/\D/g,'');
});
//BOTONES STREAM
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
    streaming.srcObject=null;
    socket.emit('endcall','');
});

//FUNCION AUDIO
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
// FUNCION STREAM
async function streamer(stream)
{
    if(idRemote)
    {
        var call = peer.call(String(idRemote),stream);
        call.on('stream',(remoteStream)=>
        {
            streaming.srcObject=remoteStream;
            streaming.play();
        });
    }else
    {
        alert('necesita conexion con el servidor');
        stopStream.disabled=true;
        startStream.disabled=false;
    }
}

//FUNCION STRING
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
        duracion.value=60;
        return false;
        
    }
    if(parseInt(numero,10)<=0)
    {
        alert("se debe colocar duracion mayor que 0");
        duracion.value=1;
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
    if(e!='NotFoundError: Requested device not found')
    {
        alert("error: "+e);
    }else
    {
        //si no tiene mic
        alert('se necesita microfono para hacer llamada')
    }
}
function groupAndSend()
{
    ConcatenateBlobs(blobArray, blobArray[0].type,(result)=>
    {
        var date = new Date();
        nombre = date.toISOString().replaceAll(':','').replace(/\..+/,'')+".wav";
        socket.emit("audio",result,nombre);
        blobArray=[];
    })
    socket.emit("mensaje","se guardo la grabacion");
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
