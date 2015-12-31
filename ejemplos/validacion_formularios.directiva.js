(function($){
  function esNif(dni) {
    var numero, letr, letra, expresion_regular_dni = /^\d{8}[a-zA-Z]$/;
    if (expresion_regular_dni.test(dni) === true) {
      numero = dni.substr(0, dni.length - 1);
      letr = dni.substr(dni.length - 1, 1);
      numero = numero % 23;
      letra = 'TRWAGMYFPDXBNJZSQVHLCKET';
      letra = letra.substring(numero, numero + 1);
      return letra === letr.toUpperCase();
    } else {
      return false;
    }
  }

  function validarDNI(campo){
    function _validar() {
      var todoCorrecto = esNif(this.value);
      this.setCustomValidity(todoCorrecto ? '' : 'DNI incorrecto');
    }
    campo.addEventListener('input', _validar);
    _validar.call(campo, arguments);
  }

  function validarIgual(campo, selector){
    function _validar(){
      var campo2 = document.querySelector(selector);
      var todoCorrecto = campo2.checkValidity() && campo2.value === this.value;
      this.setCustomValidity(todoCorrecto ? '' : 'Las contraseñas no coinciden');
    }

    campo.addEventListener('input', _validar);
    _validar.call(campo, arguments);
  }

  function contarCheckboxesSeleccionados($checkboxes){
    var cnt = 0;
    $checkboxes.each(function(i){
      cnt += $(this).is(':checked') ? 1 : 0;
    });
    return cnt;
  }

  function resultadoValidoCheckboxesSeleccionados(obtenido, min, max, numeroExacto){
    var toret = true;
    if (toret && numeroExacto){
      toret = obtenido === numeroExacto;
    } else {
      if (toret && min){
        toret = obtenido >= min;
      }

      if (toret && max){
        toret = obtenido <= max;
      }
    }
    return toret;
  }

  function validarCheckbox(campo){
    var $campo = $(campo), nombreCheckbox, $checkboxes,
      minValores, maxValores, numeroExactoValores, resultadoValido, $campoError, mensajeError;

    //Comprobamos existencia del atributo for y del campo del for
    nombreCheckbox = $campo.attr('for');
    if (!nombreCheckbox) return;
    $checkboxes = $('input:checkbox[name="' + nombreCheckbox + '"]');
    if ($checkboxes.length > 0){
      //Valores min, max y numExacto
      numeroExactoValores = parseInt($campo.attr('data-validar-checkbox'));
      if (isNaN(numeroExactoValores)){
        numeroExactoValores = null;

        minValores = parseInt($campo.attr('data-validar-checkbox-min'));
        if (isNaN(minValores)) minValores = null;

        maxValores = parseInt($campo.attr('data-validar-checkbox-max'));
        if (isNaN(maxValores)) maxValores = null;

        if (!minValores && !maxValores) return;
      }

      //Campo Error
      $campoError = $($campo.attr('data-validar-checkbox-campo-error'));
      mensajeError = $campo.attr('data-validar-checkbox-mensaje-error');
      if (!mensajeError){
        mensajeError = $campoError.length > 0 ? $.trim($campoError.text()) : 'Invalid checks number';//TODO: mejorar
      }


      //Escuchamos cambios en los checkboxes
      $checkboxes.change(function(){
        //Comprueba si el número de checkboxes seleccionados es correcto
        resultadoValido = resultadoValidoCheckboxesSeleccionados(contarCheckboxesSeleccionados($checkboxes), minValores, maxValores, numeroExactoValores);

        if ($campoError.length > 0){
          $campoError[!resultadoValido ? 'show' : 'hide']();
        }

        $checkboxes.each(function(){
          $(this).get(0).setCustomValidity(resultadoValido ? '': mensajeError);
        });
      });

      //Establece la validez inicial sin mostrar errores
      resultadoValido = resultadoValidoCheckboxesSeleccionados(contarCheckboxesSeleccionados($checkboxes), minValores, maxValores, numeroExactoValores);

      $checkboxes.each(function(){
        $(this).get(0).setCustomValidity(resultadoValido ? '': mensajeError);
      });
    } else return;
  }

  //Le decimos al documento que cuando esté listo invoque nuestras funciones personalizadas
  document.addEventListener('DOMContentLoaded', function(){
    var campos, i;

    campos = document.querySelectorAll('input[data-validar-dni]');
    for (i = campos.length - 1; i >= 0; i--){
      validarDNI(campos[i]);
    }

    campos = document.querySelectorAll('input[data-validar-igual]');
    for (i = campos.length - 1; i >= 0; i--){
      validarIgual(campos[i], campos[i].dataset.validarIgual);
    }

    campos = document.querySelectorAll('label[data-validar-checkbox]');
    for (i = campos.length - 1; i >= 0; i--){
      validarCheckbox(campos[i]);
    }
  });
})(window.jQuery);
