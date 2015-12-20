((function(TCN, $){

  function gup( name, url ) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    return results === null ? null : decodeURIComponent(results[1]);
  }

  function testear(url, urlPostResultados, notificarPagina, callback){
    if (typeof callback !== 'function'){
      throw new Error("Callback inválido");
    }

    //obtemos la url
    $.getJSON(url).then(function(datos){
      try {
        TCN.testearPaginas(datos, null, notificarPagina, function(error, res){
          if (!error && urlPostResultados){
            $.post(urlPostResultados, {resultados: res});
          }
          callback.apply(this, arguments);
        });
      } catch(e){
        callback(e);
      }
    }, function callbackGetJSON(err){
      callback(new Error('Error al obtener el JSON de las pruebas'));
    });
  }

  function getEstadisticasPaginas(resultadoPaginas){
    var es = {
        totalTestsIncorrectos : 0,
        totalTests: 0,
        totalCamposConErrores: 0,
        totalCampos: 0,
        totalFormulariosConErrores:0,
        totalFormularios: 0,
        totalPaginasConErrores:0,
        totalPaginas: 0
      },
      paginaConErrores,
      formularioConErrores,
      campoConErrores;


    es.totalPaginas = Object.keys(resultadoPaginas).length;
    for(var nombrePagina in resultadoPaginas){
      paginaConErrores = false;
      es.totalFormularios += Object.keys(resultadoPaginas[nombrePagina]).length;
      for (var nombreFormulario in resultadoPaginas[nombrePagina]){
        formularioConErrores = false;
        es.totalCampos += Object.keys(resultadoPaginas[nombrePagina][nombreFormulario]).length;
        for (var nombreCampo in resultadoPaginas[nombrePagina][nombreFormulario]){
          campoConErrores = false;
          es.totalTests += Object.keys(resultadoPaginas[nombrePagina][nombreFormulario][nombreCampo]).length;
          for(var valorTest in resultadoPaginas[nombrePagina][nombreFormulario][nombreCampo]){
            if (!resultadoPaginas[nombrePagina][nombreFormulario][nombreCampo][valorTest].correcto){
              console.log(nombrePagina, nombreFormulario, nombreCampo, valorTest);
              campoConErrores = true;
              es.totalTestsIncorrectos++;
            }
          }
          if (campoConErrores) {
            formularioConErrores = true;
            es.totalCamposConErrores++;
          }
        }
        if (formularioConErrores){
          paginaConErrores = true;
          es.totalFormulariosConErrores++;
        }
      }
      if (paginaConErrores){
        es.totalPaginasConErrores++;
      }
    }

    return es;

  }

  //Inicio
  ((function(){
    var url = gup('dataUrl', location.href),
      urlPostResultados = gup('urlPostResultados', location.href),
      $resultadosParciales = $('#resultados-parciales'),
      $resultadosTotales = $('#resultados-totales'),
      $errores = $('#errores');

    function mostrarResultadoParcial(urlPagina, resultadosPagina){
      var $elementoLista = $('<li>')
        .append($('<span>').text('Página "'+ urlPagina + '":'))
        .append($('<textarea>').val(JSON.stringify(resultadosPagina)));

      $resultadosParciales.append($elementoLista);
    }

    function mostrarResultadoFinal(error, datos){
      if (error){
        console.error(error.stack);
        $errores.text(error.message);
      } else {
        $resultadosTotales.text(JSON.stringify(datos));

        //Renderizar estadísticas
        var es = getEstadisticasPaginas(datos);
        $('#total-tests-incorrectos').text(es.totalTestsIncorrectos + '/' + es.totalTests);
        $('#total-tests').text(es.totalTests);
        $('#total-campos-erroneos').text(es.totalCamposConErrores + '/' + es.totalCampos);
        $('#total-campos').text(es.totalCampos);
        $('#total-formularios-erroneos').text(es.totalFormulariosConErrores + '/' + es.totalFormularios);
        $('#total-formularios').text(es.totalFormularios);
        $('#total-paginas-erroneas').text(es.totalPaginasConErrores + '/' + es.totalPaginas);
        $('#total-paginas').text(es.totalPaginas);

        //Renderizar tabla resultadosPagina
        var $tabla = $("<table>").addClass('table table-striped');
        $tabla.append(
          $('<tr>').append(
            $('<th>').text('URL página')
          ).append(
            $('<th>').text('Nombre formulario')
          ).append(
            $('<th>').text('Nombre campo')
          ).append(
            $('<th>').text('Valor test')
          ).append(
            $('<th>').text('Esperado')
          ).append(
            $('<th>').text('Obtenido')
          ).append(
            $('<th>').text('Correcto')
          )
        );

        var resultadoTest, textoValorTest;
        for(var urlPagina in datos){
          for(var nombreFormulario in datos[urlPagina]){
            for(var nombreCampo in datos[urlPagina][nombreFormulario]){
              for(var valorTest in datos[urlPagina][nombreFormulario][nombreCampo]){
                resultadoTest = datos[urlPagina][nombreFormulario][nombreCampo][valorTest];
                if (valorTest.length <= 30){
                  textoValorTest = valorTest;
                } else {
                  textoValorTest = valorTest.substr(0, 15) + '...' + valorTest.substr(valorTest.length - 15, 15);
                }

                $tabla.append(
                  $('<tr>').append(
                    $('<td>').text(urlPagina)
                  ).append(
                    $('<td>').text(nombreFormulario)
                  ).append(
                    $('<td>').text(nombreCampo)
                  ).append(
                    $('<td>').append(
                      $('<pre>').text(textoValorTest)
                    )
                  ).append(
                    $('<td>').text(resultadoTest.esperado)
                  ).append(
                    $('<td>').text(resultadoTest.obtenido)
                  ).append(
                    $('<td>').append(
                      $('<span>').css('color', resultadoTest.correcto ? 'green' : 'red').text(resultadoTest.correcto)
                    )
                  )
                );
              }
            }
          }
        }

        $("#div-tabla-resultados").append($tabla);
      }
    }

    testear(url, urlPostResultados, mostrarResultadoParcial, mostrarResultadoFinal);
  })());
})(window.TCN, window.jQuery));
