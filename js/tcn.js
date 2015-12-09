((function(exports, $){

  if (!$){
    throw new Error('No se ha encontrado jQuery');
  }

  function fireEvent(node, eventName) {
    // Make sure we use the ownerDocument from the provided node to avoid cross-window problems
    var doc;
    if (node.ownerDocument) {
      doc = node.ownerDocument;
    } else if (node.nodeType == 9) {
      // the node may be the document itself, nodeType 9 = DOCUMENT_NODE
      doc = node;
    } else {
      throw new Error("Invalid node passed to fireEvent: " + node.id);
    }

    if (node.dispatchEvent) {
      // Gecko-style approach (now the standard) takes more work
      var eventClass = "";

      // Different events have different event classes.
      // If this switch statement can't map an eventName to an eventClass,
      // the event firing is going to fail.
      switch (eventName) {
        case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
        case "mousedown":
        case "mouseup":
          eventClass = "MouseEvents";
          break;

        case "focus":
        case "change":
        case "blur":
        case 'input':
        case 'keyup':
        case "select":
        case 'propertychange':
          eventClass = "HTMLEvents";
          break;

        default:
          throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
      }
      var event = doc.createEvent(eventClass);

      var bubbles = eventName == "change" ? false : true;
      event.initEvent(eventName, bubbles, true); // All events created as bubbling and cancelable.

      event.synthetic = true; // allow detection of synthetic events
      // The second parameter says go ahead with the default action
      node.dispatchEvent(event, true);
    } else if (node.fireEvent) {
      // IE-old school style
      var evento = doc.createEventObject();
      evento.synthetic = true; // allow detection of synthetic events
      node.fireEvent("on" + eventName, evento);
    }
  }

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

    //Simulamos que el usuario introduce los valores
    ['input', 'change', 'click', 'keyup', 'propertychange'].forEach(function(nombreEvento){
      fireEvent($campo.get(0), nombreEvento);
    });

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

    //TODO: Mejorar
    if (!$(formulario).length){
      throw new Error('No existe el formulario');
    }

    if (pruebas instanceof Object === false){
      throw new Error('Pruebas inválidas');
    }

    //Definición de variables
    var resultado = {},
      resultadoEsperado, resultadoObtenido, resultadoCorrecto, valorEntrada, $campo;

    //Algoritmo
    for(var nombreCampo in pruebas){

      //TODO: mejorar para excluir 'submit'
      $campo = $(formulario).find('input[name="' + nombreCampo + '"]');
      if ($campo.length === 0){
        throw new Error('Campo "' + nombreCampo + '" no encontrado en el formulario "' + formulario.name + '".');
      }

      resultado[nombreCampo] = {};

      for (valorEntrada in pruebas[nombreCampo]){
        resultadoEsperado = pruebas[nombreCampo][valorEntrada];
        resultadoObtenido = introducirYComprobar($campo, valorEntrada);
        resultadoCorrecto = resultadoEsperado === resultadoObtenido;
        resultado[nombreCampo][valorEntrada] = {
          esperado: resultadoEsperado,
          obtenido: resultadoObtenido,
          correcto: resultadoCorrecto
        };
      }
    }

    return resultado;
  }

  function testearPagina(url, formulariosPruebas, callback){
    //Comprobaciones
    if (typeof url !== 'string'){
      throw new Error('URL de la página inválida');
    }

    if (formulariosPruebas instanceof Object === false){
      throw new Error('Datos de la página inválidos');
    }

    if (typeof callback !== 'function'){
      throw new Error('Callback inválido');
    }

    //Definiciones
    var  $iframe = $('<iframe/>', {src : url}).hide(),
      $formulario,
      resultado = {};

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
            resultado[nombreFormulario] = testearFormulario($formulario.get(0), formulariosPruebas[nombreFormulario]);
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
    if (datos instanceof Object === false){
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
    var resultado = {},
      paginas = Object.keys(datos);

    //Algoritmo
    function recursivo(i){
      if (i >= paginas.length) {
        callback(null, resultado);
        return;
      }

      testearPagina(paginas[i], datos[paginas[i]], function(error, respuesta){
        if (error) callback(error);
        else {
          resultado[paginas[i]] = respuesta;
          notificarPaginaTesteada(paginas[i], respuesta);
          recursivo(i+1);
        }
      });
    }

    recursivo(0);

    return resultado;
  }


  var TCN = function(){};

  TCN.testearPaginas = testearPaginas;
  TCN.testearPagina = testearPagina;
  TCN.testearFormulario = testearFormulario;
  TCN.esCampoValido = esCampoValido;

  exports.TCN = TCN;

})(window, window.$));
