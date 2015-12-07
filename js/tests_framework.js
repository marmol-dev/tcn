((function(exports){

  function esCampoValido($campo){
    var campo = $campo.get(0);
    //checkValidity returns a boolean
    if (campo.checkValidity()){
      return true;
    } else {
      return false;
    }
  }

  function introducirYComprobar($campo, valor){
    $campo.val(valor);
    return esCampoValido($campo);
  }


  /**
   * Comprueba si un formulario es correcto a partir de unos datos de entrada
   * @param <Element> El DOMElement del formulario
   * @param <{<string>:<{<string>:<boolean>}>}> Las pruebas que se van a realizar en el formulario
   * @return <{<string>:[{entrada:<string>, esperado: <boolean>, obtenido:<boolean>, correcto:<boolean>}...]}>
   * @example Ejemplo de los datos de entrada y salida:
     entradaFormulario = {
       nombre : {
         ' ' : false,
         'martin' : true,
       }
     }

     resultadoFormulario = {
       nombre : [
         {
           entrada: 'aa',
           esperado: false,
           obtenido: false,
           correcto: true
         },
         ...
       ]
     }
   */


  function testearFormulario(formulario, pruebas){
    //Comprobaciones
    if (!$(formulario).length){
      throw new Error('No existe el formulario');
    }

    if (pruebas instanceof Object === false){
      throw new Error('Pruebas inválidas');
    }

    //Definición de variables
    var resultado = {},
      resultadoEsperado, resultadoobtenido, resultadoCorrecto, valorEntrada, $campo;

    //Algoritmo
    for(var nombreCampo in pruebas){

      //TODO: mejorar para excluir 'submit'
      $campo = $(formulario).find('input[name="' + nombreCampo + '"]');
      if ($campo.length === 0){
        throw new Error('Campo "' + nombreCampo + '" no encontrado en el formulario "' + formulario.name + '".');
      }

      resultado[nombreCampo] = [];

      for (valorEntrada in pruebas[nombreCampo]){
        resultadoEsperado = pruebas[nombreCampo][valorEntrada];
        resultadoObtenido = introducirYComprobar($campo, valorEntrada);
        resultadoCorrecto = resultadoEsperado === resultadoObtenido;
        resultado[nombreCampo].push({
          entrada: valorEntrada,
          esperado: resultadoEsperado,
          obtenido: resultadoObtenido,
          correcto: resultadoCorrecto
        });
      }
    }

    return resultado;
  }

  function testearPagina(datos, callback){
    //Comprobaciones
    if (datos instanceof Object === false){
      throw new Error('Datos de la página inválidos');
    }

    if (typeof datos.url !== 'string'){
      throw new Error('URL de la página inválida');
    }

    if (typeof callback !== 'function'){
      throw new Error('Callback inválido');
    }

    //Definiciones
    var url = datos.url,
      formulariosPruebas = datos.formularios,
      $iframe = $('<iframe/>', {src : url}).hide(),
      $formulario,
      resultado = {
        url: url,
        formularios : {}
      };

    function enviarCallback(){
      $iframe.remove();
      return callback.apply(this, arguments);
    }

    //Algoritmo
    $iframe.on('load', function(){
      var $pagina = $iframe.contents();

      for (var nombreFormulario in formulariosPruebas){
        $formulario = $pagina.find('form[name="'+ nombreFormulario + '"]');

        if ($formulario.length === 0){
          enviarCallback(new Error('Formulario "' + nombreFormulario + '" no encontrado en la url "' + url + '"'), null);
          return;
        } else {
          try {
            resultado.formularios[nombreFormulario] = testearFormulario($formulario.get(0), formulariosPruebas[nombreFormulario]);
          } catch (e){
            enviarCallback(e, null);
            return;
          }
        }
      }

      enviarCallback(null, resultado);

    });

    $('body').append($iframe);
  }

  function testearPaginas(datos, paralelos, notificarPaginaTesteada, callback){
    //Comprobaciones
    if (!Array.isArray(datos)){
      throw new Error('Datos de las páginas inválidos');
    }

    if (parseInt(paralelos) != paralelos){
      paralelos = 1;
    }

    if (typeof notificarPaginaTesteada !== 'function'){
      notificarPaginaTesteada = function(){};
    }

    if (typeof callback !== 'function'){
      throw new Error('Callback inválido');
    }

    //Definición
    var resultado = [];

    //Algoritmo
    function recursivo(i){
      if (i >= datos.length) {
        callback(null, resultado);
        return;
      }

      testearPagina(datos[i], function(error, respuesta){
        if (error) callback(error);
        else {
          resultado[i] = respuesta;
          notificarPaginaTesteada(respuesta);
          recursivo(i+1);
        }
      });
    }

    recursivo(0);

    return resultado;
  }


  var FrameworkTests = function(){};

  FrameworkTests.testearPaginas = testearPaginas;
  FrameworkTests.testearPagina = testearPagina;
  FrameworkTests.testearFormulario = testearFormulario;
  FrameworkTests.esCampoValido = esCampoValido;

  exports.FrameworkTests = FrameworkTests;

})(window));
