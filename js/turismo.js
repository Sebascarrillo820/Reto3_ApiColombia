
// =============================================
// GUÍA TURÍSTICA DE COLOMBIA
// Consumo de API con Fetch
// =============================================

// Dirección de la API
const API_TURISMO =
    "https://api-colombia.com/api/v1/TouristicAttraction";

// Elementos del HTML
const contenedorTurismo =
    document.getElementById("contenedorTurismo");

const estadoTurismo =
    document.getElementById("estadoTurismo");

const buscadorTurismo =
    document.getElementById("buscadorTurismo");

const contadorTurismo =
    document.getElementById("contadorTurismo");

// Almacenará los destinos recibidos de la API
let destinosTuristicos = [];


// =============================================
// OBTENER INFORMACIÓN DE LA API
// =============================================

async function cargarDestinos() {

    try {

        estadoTurismo.textContent =
            "Cargando destinos turísticos...";

        estadoTurismo.classList.remove("error");

        const respuesta = await fetch(API_TURISMO);

        // Comprobar si la respuesta fue correcta
        if (!respuesta.ok) {
            throw new Error(
                "No fue posible obtener los destinos turísticos."
            );
        }

        const datos = await respuesta.json();

        // Comprobar que la respuesta tenga información
        if (!Array.isArray(datos)) {
            throw new Error(
                "La información recibida de la API no tiene el formato esperado."
            );
        }

        // Guardar los primeros 20 destinos
        destinosTuristicos = datos.slice(0, 20);

        estadoTurismo.textContent = "";

        // Mostrar los destinos
        mostrarDestinos(destinosTuristicos);

    } catch (error) {

        console.error("Error al cargar el turismo:", error);

        estadoTurismo.textContent =
            "No se pudieron cargar los destinos turísticos. " +
            "Comprueba tu conexión a internet e inténtalo nuevamente.";

        estadoTurismo.classList.add("error");

        contadorTurismo.textContent =
            "No hay destinos disponibles.";

    }
}


// =============================================
// OBTENER EL NOMBRE DE LA CIUDAD
// =============================================

function obtenerCiudad(destino) {

    if (typeof destino.city === "string") {
        return destino.city;
    }

    if (destino.city && typeof destino.city === "object") {
        return destino.city.name || "No especificada";
    }

    return destino.cityName || "No especificada";
}


// =============================================
// OBTENER EL NOMBRE DEL DEPARTAMENTO
// =============================================

function obtenerDepartamento(destino) {

    if (typeof destino.department === "string") {
        return destino.department;
    }

    if (
        destino.department &&
        typeof destino.department === "object"
    ) {
        return destino.department.name || "No especificado";
    }

    return destino.departmentName || "No especificado";
}


// =============================================
// OBTENER LA DESCRIPCIÓN
// =============================================

function obtenerDescripcion(destino) {

    return destino.description ||
        destino.shortDescription ||
        "No hay una descripción disponible para este destino.";
}


// =============================================
// OBTENER UNA IMAGEN
// =============================================

function obtenerImagen(destino) {

    let imagen = null;

    // La API puede entregar imágenes en diferentes formatos
    if (typeof destino.images === "string") {

        imagen = destino.images;

    } else if (
        Array.isArray(destino.images) &&
        destino.images.length > 0
    ) {

        const primeraImagen = destino.images[0];

        if (typeof primeraImagen === "string") {
            imagen = primeraImagen;
        } else if (primeraImagen && typeof primeraImagen === "object") {
            imagen =
                primeraImagen.url ||
                primeraImagen.imageUrl ||
                primeraImagen.src;
        }

    }

    // Otras propiedades posibles
    imagen =
        imagen ||
        destino.image ||
        destino.imageUrl ||
        destino.photo;

    // Evitar direcciones de imagen no seguras
    if (
        typeof imagen === "string" &&
        /^https?:\/\//i.test(imagen)
    ) {
        return imagen;
    }

    return "https://placehold.co/600x400?text=Destino+Turistico";
}


// =============================================
// CREAR UNA TARJETA
// =============================================

function crearTarjeta(destino) {

    // Crear los elementos HTML
    const tarjeta = document.createElement("article");
    tarjeta.classList.add("turismo-card");

    const imagen = document.createElement("img");

    imagen.src = obtenerImagen(destino);
    imagen.alt = destino.name || "Destino turístico de Colombia";
    imagen.loading = "lazy";

    // Imagen alternativa si la original falla
    imagen.onerror = function () {
        this.onerror = null;
        this.src =
            "https://placehold.co/600x400?text=Imagen+no+disponible";
    };

    const contenido = document.createElement("div");
    contenido.classList.add("turismo-card-content");

    const titulo = document.createElement("h2");
    titulo.textContent =
        destino.name || "Destino turístico sin nombre";

    const ubicacion = document.createElement("p");
    ubicacion.classList.add("ubicacion");

    ubicacion.textContent =
        "📍 " + obtenerCiudad(destino) +
        " - " + obtenerDepartamento(destino);

    const descripcion = document.createElement("p");
    descripcion.classList.add("descripcion");

    descripcion.textContent =
        obtenerDescripcion(destino);

    // Organizar los elementos
    contenido.appendChild(titulo);
    contenido.appendChild(ubicacion);
    contenido.appendChild(descripcion);

    tarjeta.appendChild(imagen);
    tarjeta.appendChild(contenido);

    return tarjeta;
}


// =============================================
// MOSTRAR LOS DESTINOS EN EL HTML
// =============================================

function mostrarDestinos(lista) {

    // Limpiar las tarjetas anteriores
    contenedorTurismo.innerHTML = "";

    if (lista.length === 0) {

        estadoTurismo.textContent =
            "No se encontraron destinos turísticos.";

        contadorTurismo.textContent =
            "0 destinos encontrados.";

        return;
    }

    estadoTurismo.textContent = "";

    contadorTurismo.textContent =
        `Mostrando ${lista.length} de ${destinosTuristicos.length} destinos turísticos.`;

    // Crear y agregar las tarjetas
    lista.forEach(function (destino) {

        const tarjeta = crearTarjeta(destino);

        contenedorTurismo.appendChild(tarjeta);

    });

}


// =============================================
// BUSCADOR DE DESTINOS TURÍSTICOS
// =============================================

buscadorTurismo.addEventListener("input", function () {

    const texto = this.value
        .toLowerCase()
        .trim();

    // Filtrar por nombre, ciudad o departamento
    const resultados = destinosTuristicos.filter(
        function (destino) {

            const nombre =
                destino.name || "";

            const ciudad =
                obtenerCiudad(destino);

            const departamento =
                obtenerDepartamento(destino);

            const descripcion =
                obtenerDescripcion(destino);

            const informacion =
                `${nombre} ${ciudad} ${departamento} ${descripcion}`
                    .toLowerCase();

            return informacion.includes(texto);

        }
    );

    mostrarDestinos(resultados);

});


// =============================================
// INICIAR LA APLICACIÓN
// =============================================

cargarDestinos();
