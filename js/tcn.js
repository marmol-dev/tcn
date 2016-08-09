((function (exports, $) {

    if (!$) {
        throw new Error('No se ha encontrado jQuery');
    }

    function esArrayDe(array, tipo) {
        if (typeof tipo !== 'string') {
            throw new Error('Tipo inválido');
        }

        if (!Array.isArray(array)) {
            return false;
        } else {
            var i = array.length - 1;
            while (i >= 0 && typeof array[i] === tipo) {
                i--;
            }
            return i === -1;
        }
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

    function esCampoValido($campo) {
        var campo;
        if ($campo.is('input:checkbox') || $campo.is('input:radio')) {
            var resultados = [];
            $campo.each(function (i) {
                resultados.push(!!this.checkValidity());
            });
            return andLogico(resultados);
        } else {
            campo = $campo.get(0);
            return !!campo.checkValidity();
        }
    }

    function simularEventosInput(campo) {
        var eventosSimulacion = ['input', 'change', 'click', 'keyup', 'propertychange'];
        for (var i = 0; i < eventosSimulacion.length; i++) {
            fireEvent(campo, eventosSimulacion[i]);
        }
    }

    function introducirYComprobar($campo, valor) {
        if ($campo.is('input:checkbox') || $campo.is('input:radio')) {
            var $campo_hijo;

            if ($campo.is('input:checkbox')) {
                //Deseleccionamos todos los checkboxes
                $campo.each(function () {
                    $campo_hijo = $(this);
                    if ($campo_hijo.is(':checked')) {
                        $campo_hijo.get(0).click();
                    }
                });

                var valores = valor.split(',,');
                if (valores > $campo.length) {
                    throw new Error('Se han insertado demasiados valores para el checkbox "' + $campo.attr('name') + '"');
                }

                //Comprobamos si el valor es vacío para no seleccionar ningún checkbox
                if ($.trim(valor).length > 0) {
                    //Seleccionamos los checkbox cuyos valores están en el conjunto de valores
                    for (var i = 0; i < valores.length; i++) {
                        $campo_hijo = $campo.filter('[value="' + valores[i] + '"]');
                        if ($campo_hijo.length === 0) {
                            throw new Error('No se ha encontrado el checkbox con nombre "' + $campo.attr('name') + '" y valor "' + valores[i] + '"');
                        }
                        $campo_hijo.get(0).click();
                    }
                }
            } else {
                //Deseleccionamos todos los radios
                $campo.each(function () {
                    $campo_hijo = $(this);
                    $campo_hijo.prop('checked', false);
                });

                //Si se ha especificado un valor
                if ($.trim(valor).length > 0) {
                    //Buscamos el radio concreto y lo seleccionamos
                    $campo_hijo = $campo.filter('[value="' + valor + '"]');

                    if ($campo_hijo.length === 0) {
                        throw new Error('No se ha encontrado el radio con nombre "' + $campo.attr('name') + '" y valor "' + valor + '"');
                    }

                    $campo_hijo.get(0).click();
                }
            }
        } else {
            //Si hay un campo maxlength no va a mostrar el campo como erroneo
            //sino que lo truncará
            var maxLength = parseInt($campo.attr('maxlength'));
            if (!isNaN(maxLength) && maxLength < valor.length){
                return false;
            }
            
            $campo.val(valor);
            simularEventosInput($campo.get(0));
        }

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

    function andLogico(array) {
        var i = array.length - 1;
        while (i >= 0 && array[i] === true) {
            i--;
        }
        return i === -1;
    }

    function testearFormulario(formulario, definicionPruebas) {
        //Definición variables
        var resultadoPruebas = {},
                nombreConjuntoCampos,
                nombresConjuntoCampos,
                valorConjuntoCampos,
                valoresConjuntoCampos,
                i,
                resultadoEsperadoValorCampo,
                resultadoObtenidoValorCampo,
                resultadoCorrectoValorCampo,
                resultadosEsperadosValorConjuntoCampos,
                $campo;


        //Realizamos las comprobaciones de los parámetros de entrada
        //Validación del formulario
        if (formulario instanceof HTMLElement === false) {
            //throw new Error('Formulario inválido');
        }

        //Validación de las pruebas
        var errorDefinicionPruebasInvalida = 'Definición de pruebas de formulario "' + formulario.name + '" inválida.';
        if (definicionPruebas instanceof Object === false) {
            throw new Error(errorDefinicionPruebasInvalida);
        }

        for (nombreConjuntoCampos in definicionPruebas) {
            if (definicionPruebas[nombreConjuntoCampos] instanceof Object === false) {
                throw new Error(errorDefinicionPruebasInvalida);
            }
        }

        //Algoritmo
        for (nombreConjuntoCampos in definicionPruebas) {
            nombresConjuntoCampos = nombreConjuntoCampos.split('&&');
            //Comprobamos que existen todos los campos del conjunto de campos
            for (i = nombresConjuntoCampos.length - 1; i >= 0; i--) {
                if ($(formulario).find('[name="' + nombresConjuntoCampos[i] + '"]').length === 0) {
                    throw new Error('No existe el campo con nombre "' + nombresConjuntoCampos[i] + '" en el formulario "' + formulario.name + '".');
                }
            }
            resultadoPruebas[nombreConjuntoCampos] = {};
            for (valorConjuntoCampos in definicionPruebas[nombreConjuntoCampos]) {
                valoresConjuntoCampos = valorConjuntoCampos.split('&&');
                //Comprueba que el número de conjunto de campos sea el mismo que el número de valores
                if (nombresConjuntoCampos.length !== valoresConjuntoCampos.length) {
                    if (nombreConjuntoCampos.length === 1) {
                        valoresConjuntoCampos = [valorConjuntoCampos];
                    } else {
                        throw new Error('El conjunto de campos "' + nombreConjuntoCampos + '" no tiene el mismo número de valores ("' + valorConjuntoCampos + '")');
                    }
                }

                //Comprueba que el resultado esperado sea boolean
                resultadoEsperadoValorConjuntoCampos = definicionPruebas[nombreConjuntoCampos][valorConjuntoCampos];
                if (typeof resultadoEsperadoValorConjuntoCampos !== 'boolean') {
                    throw new Error('El resultado esperado del valor(es) "' + valorConjuntoCampos + '" del campo(s) "' + nombreConjuntoCampos + '" no es válido.');
                }

                //Guarda los resultados obtenidos
                resultadosObtenidosValoresConjuntoCampos = [];
                for (i = 0; i < nombresConjuntoCampos.length; i++) {
                    $campo = $(formulario).find('[name="' + nombresConjuntoCampos[i] + '"]');
                    resultadosObtenidosValoresConjuntoCampos[i] = introducirYComprobar($campo, valoresConjuntoCampos[i]);
                }
                //Calcula el resultado obtenido para el conjunto de campos
                resultadoObtenidoValorConjuntoCampos = andLogico(resultadosObtenidosValoresConjuntoCampos);

                //Añade los resultados al objeto de resultados
                resultadoPruebas[nombreConjuntoCampos][valorConjuntoCampos] = {
                    esperado: resultadoEsperadoValorConjuntoCampos,
                    obtenido: resultadoObtenidoValorConjuntoCampos,
                    correcto: resultadoObtenidoValorConjuntoCampos === resultadoEsperadoValorConjuntoCampos
                };

            }
        }

        return resultadoPruebas;
    }

    function testearPagina(url, formulariosPruebas, callback) {
        //Comprobaciones
        if (typeof url !== 'string') {
            throw new Error('URL de la página inválida');
        }

        if (formulariosPruebas instanceof Object === false) {
            throw new Error('Datos de la página inválidos');
        }

        if (typeof callback !== 'function') {
            throw new Error('Callback inválido');
        }

        //Definiciones
        var $iframe = $('<iframe/>', {src: url}).hide(),
                $formulario,
                resultado = {};

        function enviarCallback() {
            $iframe.remove();
            return callback.apply(this, arguments);
        }

        //Algoritmo
        $iframe.on('load', function () {
            var $pagina = $iframe.contents();

            for (var nombreFormulario in formulariosPruebas) {
                $formulario = $pagina.find('form[name="' + nombreFormulario + '"]');

                if ($formulario.length === 0) {
                    enviarCallback(new Error('Formulario "' + nombreFormulario + '" no encontrado en la url "' + url + '"'), null);
                    return;
                } else {
                    try {
                        resultado[nombreFormulario] = testearFormulario($formulario.get(0), formulariosPruebas[nombreFormulario]);
                    } catch (e) {
                        enviarCallback(e, null);
                        return;
                    }
                }
            }

            enviarCallback(null, resultado);

        });

        $('body').append($iframe);
    }

    function testearPaginas(datos, paralelos, notificarPaginaTesteada, callback) {
        //Comprobaciones
        if (datos instanceof Object === false) {
            throw new Error('Datos de las páginas inválidos');
        }

        if (parseInt(paralelos) != paralelos) {
            paralelos = 1;
        }

        if (typeof notificarPaginaTesteada !== 'function') {
            notificarPaginaTesteada = function () {};
        }

        if (typeof callback !== 'function') {
            throw new Error('Callback inválido');
        }

        //Definición
        var resultado = {},
                paginas = Object.keys(datos);

        //Algoritmo
        function recursivo(i) {
            if (i >= paginas.length) {
                callback(null, resultado);
                return;
            }

            testearPagina(paginas[i], datos[paginas[i]], function (error, respuesta) {
                if (error)
                    callback(error);
                else {
                    resultado[paginas[i]] = respuesta;
                    notificarPaginaTesteada(paginas[i], respuesta);
                    recursivo(i + 1);
                }
            });
        }

        recursivo(0);

        return resultado;
    }


    var TCN = function () {};

    TCN.testearPaginas = testearPaginas;
    TCN.testearPagina = testearPagina;
    TCN.testearFormulario = testearFormulario;
    TCN.esCampoValido = esCampoValido;

    exports.TCN = TCN;

})(window, window.$));
