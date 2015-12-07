((function(FrameworkTests, $){

  function gup( name, url ) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    return results === null ? null : results[1];
  }

  function testear(url, notificarPagina, callback){
    if (typeof callback !== 'function'){
      throw new Error("Callback inválido");
    }

    //obtemos la url
    $.getJSON(url).then(function(datos){
      FrameworkTests.testearPaginas(datos, null, notificarPagina, callback);
    }, function callbackGetJSON(err){
      callback(new Error('Error al obtener el JSON de las pruebas'));
    });
  }

  //Inicio
  ((function(){
    var url = decodeURIComponent(gup('dataUrl', location.href)),
      $resultadosParciales = $('#resultados-parciales'),
      $resultadosTotales = $('#resultados-totales'),
      $errores = $('#errores');

    function mostrarResultadoParcial(pagina){
      var $elementoLista = $('<li>')
        .append($('<span>').text('Página "'+ pagina.url + '":'))
        .append($('<textarea>').val(JSON.stringify(pagina)));

      $resultadosParciales.append($elementoLista);
    }

    function mostrarResultadoFinal(error, datos){
      if (error){
        console.error(error.stack);
        $errores.val(error.message);
      } else {
        $resultadosTotales.text(JSON.stringify(datos));
      }
    }

    testear(url, mostrarResultadoParcial, mostrarResultadoFinal);
  })());
})(window.FrameworkTests, window.$));
