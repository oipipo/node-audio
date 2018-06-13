var socket = io();
var audio = document.getElementById('audio');
var servidor = document.getElementById('servidor');
socket.on('mensaje',(data)=>
{
    servidor.value+=data+"\n";
});
socket.on('audio',(nombre)=>
{
    audio.src="/audios/"+nombre;
});
//audio.src="/audios/2018-06-12T003856.wav"