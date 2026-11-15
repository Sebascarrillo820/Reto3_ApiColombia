const API_URL = 'https://api-colombia.com/api/v1/Department';

const listaDepartamentos = document.querySelector('#lista-departamentos');
const estadoCarga = document.querySelector('#estado-carga');
const totalDepartamentos = document.querySelector('#total-departamentos');
const resumenRegiones = document.querySelector('#resumen-regiones');
const buscador = document.querySelector('#buscador');
const filtroRegion = document.querySelector('#filtro-region');
const mensajeSinResultados = document.querySelector('#sin-resultados');

let departamentos = [];

// Convierte numeros a un formato legible para Colombia.
function formatearNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return 'No disponible';
  return Number(valor).toLocaleString('es-CO');
}

// Evita mostrar textos vacios o propiedades que no vengan en la API.
function obtenerTexto(valor, alternativo = 'Información no disponible') {
  return valor && String(valor).trim() ? String(valor) : alternativo;
}

// Construye las tarjetas usando elementos del DOM y textContent.
function crearTarjeta(departamento, indice) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'department-card';

  const region = obtenerTexto(departamento.region?.name, 'Región no disponible');
  const capital = obtenerTexto(departamento.cityCapital?.name, 'No disponible');
  const descripcion = obtenerTexto(departamento.description, 'Este departamento no tiene una descripción registrada.');

  const parteSuperior = document.createElement('div');
  parteSuperior.className = 'card-top';

  const numero = document.createElement('span');
  numero.className = 'card-number';
  numero.textContent = `DEPARTAMENTO ${String(indice + 1).padStart(2, '0')}`;

  const etiquetaRegion = document.createElement('span');
  etiquetaRegion.className = 'region-tag';
  etiquetaRegion.textContent = region;
  parteSuperior.append(numero, etiquetaRegion);

  const titulo = document.createElement('h3');
  titulo.textContent = obtenerTexto(departamento.name, 'Departamento sin nombre');

  const textoDescripcion = document.createElement('p');
  textoDescripcion.className = 'department-description';
  textoDescripcion.textContent = descripcion;

  const separador = document.createElement('div');
  separador.className = 'card-divider';

  const estadisticas = document.createElement('div');
  estadisticas.className = 'card-stats';
  estadisticas.append(
    crearDato('Población', formatearNumero(departamento.population)),
    crearDato('Superficie', `${formatearNumero(departamento.surface)} km²`)
  );

  const datoCapital = document.createElement('p');
  datoCapital.className = 'capital';
  datoCapital.append('Capital: ');
  const capitalNegrita = document.createElement('strong');
  capitalNegrita.textContent = capital;
  datoCapital.append(capitalNegrita);

  tarjeta.append(parteSuperior, titulo, textoDescripcion, separador, estadisticas, datoCapital);
  return tarjeta;
}

function crearDato(etiqueta, valor) {
  const contenedor = document.createElement('div');
  const nombre = document.createElement('span');
  nombre.className = 'stat-label';
  nombre.textContent = etiqueta;
  const dato = document.createElement('span');
  dato.className = 'stat-value';
  dato.textContent = valor;
  contenedor.append(nombre, dato);
  return contenedor;
}

// Cuenta cuantos departamentos pertenecen a cada region.
function contarDepartamentosPorRegion(datos) {
  return datos.reduce((conteo, departamento) => {
    const region = obtenerTexto(departamento.region?.name, 'Sin región');
    conteo[region] = (conteo[region] || 0) + 1;
    return conteo;
  }, {});
}

function mostrarResumenRegiones(datos) {
  resumenRegiones.replaceChildren();
  const conteo = contarDepartamentosPorRegion(datos);

  Object.entries(conteo)
    .sort(([regionA], [regionB]) => regionA.localeCompare(regionB, 'es'))
    .forEach(([region, cantidad]) => {
      const chip = document.createElement('span');
      chip.className = 'region-chip';
      chip.append(`${region}: `);
      const numero = document.createElement('strong');
      numero.textContent = cantidad;
      chip.append(numero);
      resumenRegiones.append(chip);
    });
}

function cargarOpcionesDeRegion(datos) {
  const regiones = [...new Set(datos.map(departamento =>
    obtenerTexto(departamento.region?.name, 'Sin región')
  ))].sort((a, b) => a.localeCompare(b, 'es'));

  regiones.forEach(region => {
    const opcion = document.createElement('option');
    opcion.value = region;
    opcion.textContent = region;
    filtroRegion.append(opcion);
  });
}

function mostrarDepartamentos(datos) {
  listaDepartamentos.replaceChildren();

  datos.forEach((departamento, indice) => {
    listaDepartamentos.append(crearTarjeta(departamento, indice));
  });

  mensajeSinResultados.classList.toggle('hidden', datos.length !== 0);
}

function filtrarDepartamentos() {
  const texto = buscador.value.trim().toLocaleLowerCase('es');
  const regionSeleccionada = filtroRegion.value;

  const resultado = departamentos.filter(departamento => {
    const nombre = obtenerTexto(departamento.name, '').toLocaleLowerCase('es');
    const region = obtenerTexto(departamento.region?.name, 'Sin región');
    const coincideNombre = nombre.includes(texto);
    const coincideRegion = regionSeleccionada === 'todas' || region === regionSeleccionada;
    return coincideNombre && coincideRegion;
  });

  mostrarDepartamentos(resultado);
}

async function obtenerDepartamentos() {
  try {
    estadoCarga.classList.remove('hidden');
    estadoCarga.textContent = 'Cargando departamentos desde API Colombia...';

    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) {
      throw new Error(`La API respondió con el estado ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    if (!Array.isArray(datos)) {
      throw new Error('El formato de datos recibido no es el esperado.');
    }

    departamentos = datos;
    totalDepartamentos.textContent = departamentos.length;
    cargarOpcionesDeRegion(departamentos);
    mostrarResumenRegiones(departamentos);
    mostrarDepartamentos(departamentos);
    estadoCarga.classList.add('hidden');
  } catch (error) {
    console.error('Error al consultar los departamentos:', error);
    estadoCarga.textContent = 'No fue posible cargar los departamentos. Verifica tu conexión e inténtalo nuevamente.';
    estadoCarga.classList.remove('hidden');
  }
}

buscador.addEventListener('input', filtrarDepartamentos);
filtroRegion.addEventListener('change', filtrarDepartamentos);

obtenerDepartamentos();
