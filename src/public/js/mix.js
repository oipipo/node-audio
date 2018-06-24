var servidor = document.getElementsByClassName('servidor');
var audio = document.getElementsByClassName('audio');

//cuando recibo mensaje del servidor lo muestro en mi area de texto

socket.on("mensaje",(data)=>
{
    for (i = 0; i < servidor.length; i++) 
    {
        servidor[i].value +=data+"\t";
    }
});
socket.on('audio',(nombre)=>
{
    for (i = 0; i < audio.length; i++) 
    {
        audio[i].src="/audios/"+nombre;
    }
});