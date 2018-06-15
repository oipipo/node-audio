var socket = io();
var audio = document.getElementById('audio');
var stream = document.getElementById('stream');
var servidor = document.getElementById('servidor');
var peer = new Peer({host: 'cloud.peer-js.com'});
var id;
navigator.streaming=
(   
    navigator.getUserMedia||
    navigator.webkitGetUserMedia||
    navigator.mozGetUserMedia||
    navigator.msGetUserMedia
);
peer.on('open',function(id)
{
    socket.emit('id',id);
    socket.emit('mensaje',"se envio el peerId");
});
peer.on('call',function(call)
{
    navigator.streaming({audio:true},(stream)=>
    {
        call.answer(stream);
    },errorGrabar);
    
    call.on('stream',(remoteStream)=>
    {
        stream.srcObject=remoteStream;
    })
});

peer.on('connection', function(conn)
{
    conn.on('data',(data)=>
    {
        console.log(data);
    })
})
socket.on('peer-id',(id)=>
{
    idConnected=id;
})
socket.on('mensaje',(data)=>
{
    servidor.value+=data+"\t";
});
socket.on('audio',(nombre)=>
{
    audio.src="/audios/"+nombre;
});

function errorGrabar(e)
{
    alert("error: "+e);
}