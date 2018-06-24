var socket = io();
var stream = document.getElementById('stream');
var peer = new Peer({host: location.hostname,
    port: location.port|| (location.protocol === 'https:' ? 3001 : 3000),   path: '/peerjs',
    });
var enviarId = document.getElementById('enviarId');
var conectado = document.getElementById('conectado');
var idserv;
conectado.style.backgroundColor='red';
navigator.streaming=
(   
    navigator.getUserMedia||
    navigator.webkitGetUserMedia||
    navigator.mozGetUserMedia||
    navigator.msGetUserMedia
);
peer.on('open',function(id)
{
    idserv=id;
});
peer.on('call',function(call)
{
    navigator.streaming({audio:true},(stream)=>
    {
        call.answer(stream);
    },(e)=>
    {
        if(e!='NotFoundError: Requested device not found')
        {
            alert("error: "+e);
        }else
        {
            call.answer();
        }
    });
    
    call.on('stream',(remoteStream)=>
    {
        stream.srcObject=remoteStream;
        stream.play();
        socket.on('endcall',(empty)=>
        {
            stream.srcObject=null;
        })
    })
    
});

enviarId.addEventListener('click',()=>
{
    conectado.style.backgroundColor='green';
    socket.emit('id',idserv);
})