const API_TURISMO = 'https://api-colombia.com/api/v1/TouristicAttraction';
const API_DEPARTAMENTOS = 'https://api-colombia.com/api/v1/Department';
const IMAGEN_RESPALDO = 'https://images.unsplash.com/photo-1729866515900-513ec1b967e6?w=900&auto=format&fit=crop&q=80';

const listaAtractivos = document.querySelector('#lista-atractivos');
const estadoTurismo = document.querySelector('#estado-turismo');
const totalAtractivos = document.querySelector('#total-atractivos');
const buscadorTurismo = document.querySelector('#buscador-turismo');
const sinAtractivos = document.querySelector('#sin-atractivos');

let atractivos = [];
let departamentosPorId = new Map();

// Devuelve un texto legible cuando la API no incluye un dato.
function textoSeguro(valor, alternativo = 'Información no disponible') {
  return valor && String(valor).trim() ? String(valor) : alternativo;
}

// Obtiene la primera imagen disponible del atractivo.
function obtenerImagen(atractivo) {
  if (Array.isArray(atractivo.images) && atractivo.images.length > 0) {
    return atractivo.images[0];
  }
  if (typeof atractivo.image === 'string' && atractivo.image.trim()) {
    return atractivo.image;
  }
  return IMAGEN_RESPALDO;
}

// Crea cada tarjeta de manera dinámica usando elementos del DOM.
function crearTarjetaTuristica(atractivo, indice) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'tourism-card';

  const contenedorImagen = document.createElement('div');
  contenedorImagen.className = 'tourism-card-image';

  const imagen = document.createElement('img');
  imagen.src = obtenerImagen(atractivo);
  imagen.alt = `Imagen de ${textoSeguro(atractivo.name, 'atractivo turístico de Colombia')}`;
  imagen.loading = 'lazy';

  // Si la imagen de la API falla, se reemplaza por una imagen de respaldo de Cartagena.
  imagen.addEventListener('error', () => {
    if (!imagen.dataset.fallback) {
      imagen.dataset.fallback = 'true';
      imagen.src = IMAGEN_RESPALDO;
    } else {
      imagen.classList.add('image-unavailable');
      contenedorImagen.classList.add('image-fallback');
      contenedorImagen.textContent = 'COLOMBIA';
    }
  });

  contenedorImagen.append(imagen);

  const contenido = document.createElement('div');
  contenido.className = 'tourism-card-content';

  const numero = document.createElement('span');
  numero.className = 'tourism-number';
  numero.textContent = `DESTINO ${String(indice + 1).padStart(2, '0')}`;

  const titulo = document.createElement('h3');
  titulo.textContent = textoSeguro(atractivo.name, 'Atractivo sin nombre');

  const ciudad = atractivo.city || {};
  const nombreCiudad = textoSeguro(ciudad.name, 'Ciudad no disponible');
  const departamentoRelacionado = departamentosPorId.get(Number(ciudad.departmentId));
  const nombreDepartamento = textoSeguro(
    ciudad.department?.name || ciudad.departmentName || atractivo.department?.name || departamentoRelacionado?.name,
    'Departamento no disponible'
  );

  const ubicacion = document.createElement('p');
  ubicacion.className = 'tourism-location';
  ubicacion.textContent = `${nombreCiudad} · ${nombreDepartamento}`;

  const descripcion = document.createElement('p');
  descripcion.className = 'tourism-description';
  descripcion.textContent = textoSeguro(
    atractivo.description,
    'Este atractivo no tiene una descripción registrada.'
  );

  contenido.append(numero, titulo, ubicacion, descripcion);
  tarjeta.append(contenedorImagen, contenido);
  return tarjeta;
}

// Muestra únicamente los primeros 20 elementos recibidos desde la API.
function mostrarAtractivos(datos) {
  listaAtractivos.replaceChildren();

  datos.forEach((atractivo, indice) => {
    listaAtractivos.append(crearTarjetaTuristica(atractivo, indice));
  });

  sinAtractivos.classList.toggle('hidden', datos.length !== 0);
}

// Filtra los 20 destinos por nombre, ciudad o departamento.
function filtrarAtractivos() {
  const busqueda = buscadorTurismo.value.trim().toLocaleLowerCase('es');

  const resultados = atractivos.filter(atractivo => {
    const ciudad = atractivo.city || {};
    const departamento = ciudad.department || atractivo.department || departamentosPorId.get(Number(ciudad.departmentId)) || {};
    const texto = [
      atractivo.name,
      atractivo.description,
      ciudad.name,
      departamento.name,
      ciudad.departmentName
    ].filter(Boolean).join(' ').toLocaleLowerCase('es');

    return texto.includes(busqueda);
  });

  mostrarAtractivos(resultados);
}

async function obtenerAtractivos() {
  try {
    estadoTurismo.classList.remove('hidden');
    estadoTurismo.textContent = 'Cargando atractivos turísticos desde API Colombia...';

    const [respuestaAtractivos, respuestaDepartamentos] = await Promise.all([
      fetch(API_TURISMO),
      fetch(API_DEPARTAMENTOS)
    ]);

    if (!respuestaAtractivos.ok) {
      throw new Error(`La API de atractivos respondió con el estado ${respuestaAtractivos.status}`);
    }
    if (!respuestaDepartamentos.ok) {
      throw new Error(`La API de departamentos respondió con el estado ${respuestaDepartamentos.status}`);
    }

    const [datosAtractivos, datosDepartamentos] = await Promise.all([
      respuestaAtractivos.json(),
      respuestaDepartamentos.json()
    ]);

    if (!Array.isArray(datosAtractivos) || !Array.isArray(datosDepartamentos)) {
      throw new Error('El formato de datos recibido no es el esperado.');
    }

    departamentosPorId = new Map(datosDepartamentos.map(departamento => [Number(departamento.id), departamento]));
    atractivos = datosAtractivos.slice(0, 20);
    totalAtractivos.textContent = atractivos.length;
    mostrarAtractivos(atractivos);
    estadoTurismo.classList.add('hidden');
  } catch (error) {
    console.error('Error al consultar los atractivos turísticos:', error);
    estadoTurismo.textContent = 'No fue posible cargar los atractivos. Verifica tu conexión e inténtalo nuevamente.';
    estadoTurismo.classList.remove('hidden');
  }
}

buscadorTurismo.addEventListener('input', filtrarAtractivos);
obtenerAtractivos();
