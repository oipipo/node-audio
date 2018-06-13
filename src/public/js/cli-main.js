var socket = io(),//declaro el socket para la comunicacion
    //declaro los botones para manejo mas facil
    empezar=document.getElementById('empezar'),
    guardar=document.getElementById('guardar'),
    parar=document.getElementById('parar');
    var audio = document.getElementById('audio');
    var duracion = document.getElementById('duracion');
    var blobArray=[];
    var nombre;
//obtengo datos del microfono 
navigator.streaming=
(   navigator.getUserMedia||
    navigator.webkitGetUserMedia||
    navigator.mozGetUserMedia||
    navigator.msGetUserMedia
);//varia dependiendo del navegador
//defino que solo necesito audio
var media={audio:true};
var mediaRecorder;
var blobArray=[];
var isStopped=false;
//cuando recibo mensaje del servidor lo muestro en mi area de texto
socket.on("mensaje",(data)=>
{
    document.getElementById('servidor').value+=data+"\n";
});
socket.on('audio',(nombre)=>
{
    audio.src="/audios/"+nombre;
})

//en caso de error
function errorGrabar(e)
{
    alert("error: "+e);
}
//grabar audio
async function grabar(stream)
{  
    
    mediaRecorder = new MediaStreamRecorder(stream);
    mediaRecorder.stream = stream;
    mediaRecorder.mimeType = 'audio/wav';
    mediaRecorder.ondataavailable = function (blob) {
        blobArray.push(blob);
    };
    mediaRecorder.start(parseInt(duracion.value,10)*1000);
    parar.disabled= false;
    guardar.disabled=false;
}

//jueguito con los botones y jquery
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
    socket.emit("mensaje","se paro la grabacion y se envio al servidor");
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

duracion.addEventListener("input",()=>
{
    duracion.value=duracion.value.replace(/\D/g,'');
});

duracion.addEventListener("paste",()=>
{
    duracion.value=duracion.value.replace(/\D/g,'');
});
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
            alert("la duracion maxima para el audio son 5 minutos");
            return false
        }else
        {
            return true;
        }
    }
}

/*
    var socket = io.connect('http://localhost:3000', { 'forceNew': true });
    socket.emit("message","usuario: 'audio client' conectado");
    socket.on('message', function(data) {
        document.getElementById("servidor").value=data;
    });
    $(document).ready(()=>
    {
        $("#iniciar").hide();
    });
    function grabar()
    {
        if (!hasGetUserMedia()) 
        {
            alert('getUserMedia() is not supported by your browser');
        } 
        else 
        {
            var constraints = { audio: true, video: false };
            var promise = navigator.mediaDevices.getUserMedia(constraints)
            .then(function(mediaStream)
            {
                document.getElementById('audio').srcObject = mediaStream;
                audio.onloadedmetadata = function(e) 
                {
                    $(document).ready(()=>
                    {
                        socket.emit("message","inicio audio");
                        audio.play();          
                        $("#empezar").hide();
                        $("#iniciar").show();
                        $("#iniciar").click(()=>
                        {
                            socket.emit("message","inicio audio");
                            audio.play();          
                        });
                            
                        $("#pausa").click(()=>
                        {
                            socket.emit("message","pauso audio");
                            audio.pause();          
                        });
                    });
                };
            })
            .catch(function(err)
            { 
            alert("No tiene los permisos para grabar");
            });
        }
    }
    function hasGetUserMedia() 
    {
        if (navigator.mediaDevices === undefined) {
            navigator.mediaDevices = {};
        }
        if (navigator.mediaDevices.getUserMedia === undefined) 
        {
            navigator.mediaDevices.getUserMedia = function(constraints) 
            {
        
            // First get ahold of the legacy getUserMedia, if present
            var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        
            // Some browsers just don't implement it - return a rejected promise with an error
            // to keep a consistent interface
            if (!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
            }
        
            // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
            return new Promise(function(resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
            }
        }
        return true;
}*/
(function() {
    window.ConcatenateBlobs = async function(blobs, type, callback) {
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

        function concatenateBuffers() {
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