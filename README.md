# TCN para Javascript
Tests Caja Negra para Javascript

## Uso
La librería se puede utilizar tanto en cada una de las páginas que se quieren testear o crear una página separada para automatizar las pruebas.

Si el caso de uso es el segundo (página separada que comprueba la validez de otras) solo se necesita definir las pruebas en formato JSON (ver punto 2) y llamar al archivo donde está el json desde la página *index.html*.

### 1 Incluir jQuery y tcn.js
```html
<body>
  ...
  <script src="js/jquery.min.js" languaje="text/javascript"></script>
  <script src="js/tcn.js" languaje="text/javascript"></script>
</body>  
```

### 2 Crear el objeto de las pruebas:
La definición de las pruebas debe estar guardada en un objeto javascript (o bien en un archivo .json que se cargue con Ajax).

#### Para un formulario:
```javascript
{
  "<nombre_campo_1>" : {
    "<valor_1>" : <valor_esperado_1>
    "<valor_2>" : <valor_esperado_2>
  },
  "<nombre_campo_n>" : {
    ...
  },
}
```

El valor esperado es el un booleano que es true si se espera que la validación sea correcta y false en caso contrario.

Ejemplo:
```javascript
{
  "nombre" : {
    "" : false,
    "Ana Garriga": true,
    "a" : false,
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" : false
  },
  "apellidos": {
    "" : false,
    "Alvarez Asuriaga": true,
    "aaaa" : false,
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" : false
  },
  "email" : {
    "" : false,
    "tm@gmail.com" : true,
    "asssss" : false
  },
  "contrasena1&&contrasena2" : {
    "valor1&&valor2" : false,
    "mismo_valor&&mismo_valor" : true
  }
}
```
El campo (conjunto de campos reales) "contrasena1&&contrasena2" indica al framework que se quiere realizar una validación de varios campos (dos en este caso) introduciendo los valores:

- "valor1" en "contrasena1" y "valor2" en "contrasena2".
- "mismo_valor" en "contrasena1" y "mismo_valor" en "contrasena2".

El resultado ESPERADO (true o false) es el resultado que se espera al realizar un AND lógico en cada uno de los campos después de introducir los valores indicados. Para el primer test del caso del párrafo anterior:

1. Se introduce "valor1" en "contrasena1".
2. Se comprueba si es válido el campo "contrasena1".
3. Se introduce "valor2" en "contrasena2".
4. Se comprueba si es válido el campo "contrasena2".
5. Se comprueba el resultado obtenido de "contrasena1&&contrasena2" haciendo el AND con los resultados obtenidos del paso 2 y 4.

#### Para una página
```javascript
{
  "<nombre_formulario_1>" : <objeto_formulario_1>, //Objeto del punto anterior
  "<nombre_formulario_n>": <objeto_formulario_n>
}
```

#### Para varias páginas
```javascript
{
  "<url_pagina_1>" : <objeto_pagina_1>, //Objeto del punto anterior
  "<url_pagina_n>" : <objeto_pagina_n>
}
```

### 3 Llamar a la librería TCN
#### Para un formulario
```javascript
var res = TCN.testearFormulario(formulario, pruebas);
```
`res` es el objeto resultado y tiene la siguiente estructura:
```javascript
{
  "<nombre_campo_1>" : {
    "entrada" : "<texto_entrada>",
    "esperado" : "<valor_booleano_esperado>",
    "obtenido" : "<valor_booleano_obtenido>",
    "correcto": "<valor_booleano_correctitud>"
  },
  ...
}
```

`pruebas` es el objeto de datos definido en el punto 2 para un formulario.

#### Para una página
```javascript
TCN.testearPagina(url, pruebas, callback);
```
`url` es la url de la página a probar.
`pruebas` es el objeto de pruebas visto en el punto 2 para una página.
`callback` es la función que se invoca al finalizar el test o al producirse un error. Se llama a la función con los siguientes parámetros:
`error` un objeto *Error* si se produce un error o *null* en caso contrario.
`res` es el objeto resultado y tiene la siguiente estructura si no se han producido errores (*null* en caso contrario):
```javascript
{
  "<nombre_formulario_1>": <resultado_formulario>, //formato del resultado del punto anterior
  ...
}
```
#### Para varias páginas
```javascript
TCN.testearPaginas(datos, paralelismo, notificarPaginaTesteada, callback);
```

`datos` (requerido) es un objeto de pruebas visto en el punto 2 para varias páginas.
`paralelismo` (opcional, por defecto 1) es el número de páginas que se analizan simultáneamente.
`notificarPaginaTesteada` (opcional) es una función que se invoca cada vez que se analiza una página y recibe como parámetros: `nombrePagina`, `resultadoPagina`.
`callback` (requerido) es una función que se invoca al finalizar el análisis de todas las páginas. Recibe como parámetros: `error`, `resultadoPaginas`.
`error` un objeto *Error* si se produce un error o *null* en caso contrario.
`resultadoPaginas` un objeto resultado y tiene la siguiente estructura si no se han producido errores (*null* en caso contrario):
```javascript
{
  "<url_pagina>": <resultado_pagina>, //formato del resultado de una página
  ...
}
```

#### Ejemplos
Ver página *index.html*, *test.html* y *js/test.js* que hace uso de la librería *tcn.js*.

## Aspectos a tener en cuenta
Los tests se deberán realizar en un **navegador** que sea **compatible** con validación HTML5.

La validez de ĺos campos se obtendrá a partir de los resultados proporcionados por las funciones de **validación de HTML5** (tipo de campo, longitudes, *patterns*, ...).

Se podrán definir **funciones de validación personalizadas** para  cada campo utilizando la API que proporciona el estándar (método *.setCustomValidity()*). Un ejemplo de validación personalizada es el del *dni* de *ejemplos/ejemplo1.html*:
```javascript
document.getElementById('campo_dni').addEventListener('input', function validarCampoDNI() {
  var todoCorrecto = true;
  todoCorrecto = funcionPersonalizadaQueCompruebaElNif(this.value);
  //más comprobaciones ...
  if (todoCorrecto) {
    //otro caso a comprobar
    //todoCorrecto = miFuncion(this.value);
  }
  this.setCustomValidity(todoCorrecto ? '' : 'DNI incorrecto');
});
```

Más información sobre las validaciones HTML5: [http://www.sitepoint.com/html5-forms-javascript-constraint-validation-api/](http://www.sitepoint.com/html5-forms-javascript-constraint-validation-api/)

## Licencia
Copyright 2015 Martín Molina Álvarez

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
