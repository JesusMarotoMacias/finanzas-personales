// ==========================================
// REFERENCIAS AL DOM
// ==========================================
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const fileInput = document.getElementById('excel-file');
const uploadStatus = document.getElementById('upload-status');
const toast = document.getElementById('save-toast');

const totalIncomeElement = document.getElementById('total-income');
const totalExpensesElement = document.getElementById('total-expenses');
const totalBalanceElement = document.getElementById('total-balance');

const btnAddManual = document.getElementById('btn-add-manual');
const btnExport = document.getElementById('btn-export');
const btnClearData = document.getElementById('btn-clear-data');

// ==========================================
// DATOS GLOBALES
// ==========================================
// Variables Globales de Estado
let appData = { transactions: [], lastSaved: null };
let editingTransactionIndex = null; // Para saber qué movimiento estamos editando

// Inteligencia: Mapeo de palabras clave a categorías
const defaultKeywords = {
    "NOMINA": "Ingresos Fijos",
    "MERCADONA": "Alimentación / Supermercado",
    "CARREFOUR": "Alimentación / Supermercado",
    "LIDL": "Alimentación / Supermercado",
    "ALCAMPO": "Alimentación / Supermercado",
    "REPSOL": "Transporte / Gasolina",
    "CEPSA": "Transporte / Gasolina",
    "BP": "Transporte / Gasolina",
    "SHELL": "Transporte / Gasolina",
    "SHEL": "Transporte / Gasolina",
    "IBERDROLA": "Vivienda / Alquiler",
    "ENDESA": "Vivienda / Alquiler",
    "MOVISTAR": "Vivienda / Alquiler",
    "VODAFONE": "Vivienda / Alquiler",
    "ORANGE": "Vivienda / Alquiler",
    "DIGI": "Vivienda / Alquiler",
    "RESTAURANT": "Ocio y Restaurantes",
    "CAFE": "Ocio y Restaurantes",
    "PIZZA": "Ocio y Restaurantes",
    "BURGER": "Ocio y Restaurantes",
    "BAR ": "Ocio y Restaurantes",
    "AMAZON": "Compras y Regalos",
    "ZARA": "Ropa / Moda",
    "H&M": "Ropa / Moda",
    "DECATHLON": "Ocio y Restaurantes",
    "SPOTIFY": "Suscripciones",
    "NETFLIX": "Suscripciones",
    "HBO": "Suscripciones",
    "DISNEY": "Suscripciones",
    // Nuevas palabras solicitadas
    "FOOD": "Ocio y Restaurantes",
    "TAPERIA": "Ocio y Restaurantes",
    "DESAYUNO": "Ocio y Restaurantes",
    "HOSTELERIA": "Ocio y Restaurantes",
    "ALDI": "Alimentación / Supermercado",
    "SALUD": "Salud / Farmacia",
    "CARNICERIA": "Alimentación / Supermercado",
    "CERVECERIA": "Ocio y Restaurantes",
    "CHIRINGUITO": "Ocio y Restaurantes",
    "FARMACIA": "Salud / Farmacia",
    "GASTRO": "Ocio y Restaurantes",
    "HOTEL": "Ocio y Restaurantes",
    "PARKING": "Transporte / Gasolina",
    "BARRA": "Ocio y Restaurantes",
    "LONJA": "Ocio y Restaurantes",
    "MESON": "Ocio y Restaurantes",
    "TABERNA": "Ocio y Restaurantes",
    "TAXI": "Transporte / Gasolina",
    "GOURMET": "Ocio y Restaurantes",
    "MANGO": "Ropa / Moda",
    "PRIVALIA": "Ropa / Moda",
    "PURIFICACION GARCIA": "Ropa / Moda",
    "TINTORETO": "Ropa / Moda",
    "AEGON": "Seguros",
    "ASISA": "Seguros",
    "C.P.": "Vivienda / Alquiler",
    "COMUNIDAD PROPIETARIOS": "Vivienda / Alquiler",
    "AQUALIA": "Vivienda / Alquiler",
    "GYM": "Ocio y Restaurantes"
};

const categoryKeywords = JSON.parse(localStorage.getItem('categoryKeywords')) || {};

// Sincronizar: Añadir nuevas palabras por defecto si no existen ya en el almacenamiento del usuario
Object.keys(defaultKeywords).forEach(key => {
    if (!categoryKeywords[key]) {
        categoryKeywords[key] = defaultKeywords[key];
    }
});
localStorage.setItem('categoryKeywords', JSON.stringify(categoryKeywords));

function saveKeywords() {
    localStorage.setItem('categoryKeywords', JSON.stringify(categoryKeywords));
}

// Función de inteligencia para intuir categoría
function guessCategory(concept) {
    if (!concept) return null;
    const txt = concept.toUpperCase();
    for (const [key, category] of Object.entries(categoryKeywords)) {
        if (txt.includes(key)) return category;
    }
    return null;
}

// Actualizar inteligencia cuando el usuario asigna una categoría
function learnCategory(concept, category) {
    if (!concept || !category) return;
    // Cogemos las 2 primeras palabras del concepto como patrón
    const words = concept.toUpperCase().split(/\s+/).filter(w => w.length > 3);
    if (words.length > 0) {
        // Guardamos la primera palabra significativa como patrón
        categoryKeywords[words[0]] = category;
        saveKeywords();
    }
}

let expensesChart = null;
let incomeChart = null;
let evolutionChart = null;

// Estado de la tabla
let tableCurrentPage = 1;
const tablePageSize = 15;
let tableSortColumn = 'date';
let tableSortDir = 'desc';
let filteredTransactions = [];

// ==========================================
// CATEGORÍAS DISPONIBLES
// ==========================================
let categoryMappings = JSON.parse(localStorage.getItem('categoryMappings')) || {};

const defaultCategories = [
    "Ingresos Fijos",
    "Ingresos Extras",
    "Vivienda / Alquiler",
    "Alimentación / Supermercado",
    "Transporte / Gasolina",
    "Ocio y Restaurantes",
    "Salud / Farmacia",
    "Ropa / Moda",
    "Servicios (Luz, Agua, Internet)",
    "Seguros",
    "Compras Online",
    "Suscripciones",
    "Comisiones Bancarias",
    "Ahorro / Inversión",
    "Otros"
];

const categoryIcons = {
    "Ingresos Fijos": "💰",
    "Ingresos Extras": "🎁",
    "Vivienda / Alquiler": "🏠",
    "Alimentación / Supermercado": "🛒",
    "Transporte / Gasolina": "🚗",
    "Ocio y Restaurantes": "🍽️",
    "Salud / Farmacia": "⚕️",
    "Ropa / Moda": "👕",
    "Servicios (Luz, Agua, Internet)": "🔌",
    "Seguros": "🛡️",
    "Compras Online": "📦",
    "Comisiones Bancarias": "🏦",
    "Ahorro / Inversión": "📈",
    "Otros": "⚙️",
    "Suscripciones": "📺",
    "Traspaso": "⇄"
};

function getCategoryIcon(cat) {
    return categoryIcons[cat] || "❓";
}

let availableCategories = JSON.parse(localStorage.getItem('availableCategories')) || [...defaultCategories];

// Sincronizar categorías por defecto nuevas
defaultCategories.forEach(cat => {
    if (!availableCategories.includes(cat)) {
        availableCategories.push(cat);
    }
});
saveCategories();

function saveCategories() {
    localStorage.setItem('availableCategories', JSON.stringify(availableCategories));
}

function addNewCategoryIfMissing(categoryName) {
    if (categoryName && !availableCategories.includes(categoryName)) {
        availableCategories.push(categoryName);
        availableCategories.sort();
        saveCategories();
        refreshCategoryOptions();
    }
}

let pendingTransactions = [];

// ==========================================
// MODAL: ASISTENTE DE CATEGORÍAS
// ==========================================
const categoryModal = document.getElementById('category-modal');
const unknownConceptsContainer = document.getElementById('unknown-concepts-container');
const btnSaveCategories = document.getElementById('btn-save-categories');

btnSaveCategories.addEventListener('click', () => {
    const rows = unknownConceptsContainer.querySelectorAll('.category-row');
    rows.forEach(row => {
        const rawConcept = row.dataset.concept;
        const select = row.querySelector('.category-select');
        const textInput = row.querySelector('.category-custom-input');

        let chosenCategory;
        if (select.value === '__custom__' && textInput && textInput.value.trim() !== '') {
            chosenCategory = textInput.value.trim();
            addNewCategoryIfMissing(chosenCategory);
        } else if (select.value === '__custom__') {
            chosenCategory = 'Otros';
        } else {
            chosenCategory = select.value;
        }
        categoryMappings[rawConcept] = chosenCategory;
        learnCategory(rawConcept, chosenCategory);

        const selectedType = row.dataset.selectedType;
        if (selectedType) {
            pendingTransactions.forEach(t => {
                if (t.rawCategory === rawConcept) t.type = selectedType;
            });
        }
    });

    localStorage.setItem('categoryMappings', JSON.stringify(categoryMappings));
    categoryModal.classList.add('hidden');
    processPendingTransactions();
});

function showCategoryWizard(unknownConceptsData) {
    unknownConceptsContainer.innerHTML = '';

    unknownConceptsData.forEach(item => {
        const { concept, amount } = item;
        const row = document.createElement('div');
        row.className = 'category-row';
        row.dataset.concept = concept;
        const defaultType = amount > 0 ? 'income' : 'expense';
        row.dataset.selectedType = defaultType;

        const label = document.createElement('div');
        label.className = 'concept-name-wrapper';

        const conceptTitle = document.createElement('div');
        conceptTitle.className = 'concept-name';
        conceptTitle.textContent = concept;

        const amountSubtitle = document.createElement('div');
        amountSubtitle.className = 'concept-amount-subtitle';
        amountSubtitle.textContent = `Importe: ${formatCurrency(amount)}`;
        amountSubtitle.style.fontSize = '0.75rem';
        amountSubtitle.style.opacity = '0.7';
        amountSubtitle.style.marginTop = '0.1rem';

        label.appendChild(conceptTitle);
        label.appendChild(amountSubtitle);

        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'select-wrapper';

        const select = document.createElement('select');
        select.className = 'category-select';
        select.dataset.concept = concept;

        // Intentar adivinar categoría
        const guessed = guessCategory(concept);

        availableCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat; option.textContent = cat;
            if (cat === guessed) option.selected = true;
            select.appendChild(option);
        });

        const customOption = document.createElement('option');
        customOption.value = '__custom__';
        customOption.textContent = '✏️ Escribir mi propia categoría...';
        select.appendChild(customOption);

        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.className = 'category-custom-input';
        customInput.placeholder = 'Nombre de la categoría...';
        customInput.style.display = 'none';

        select.addEventListener('change', () => {
            customInput.style.display = select.value === '__custom__' ? 'block' : 'none';
        });

        const typeToggle = document.createElement('div');
        typeToggle.className = 'type-toggle wizard-type-toggle';
        [
            { type: 'expense', label: '📉 Gasto' },
            { type: 'income', label: '📈 Ingreso' },
            { type: 'transfer', label: '🔄 Traspaso' },
        ].forEach(({ type, label }) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `type-btn ${type}-btn${type === defaultType ? ' active' : ''}`;
            btn.textContent = label;
            btn.addEventListener('click', () => {
                typeToggle.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                row.dataset.selectedType = type;
            });
            typeToggle.appendChild(btn);
        });

        selectWrapper.appendChild(select);
        selectWrapper.appendChild(customInput);
        selectWrapper.appendChild(typeToggle);
        row.appendChild(label);
        row.appendChild(selectWrapper);
        unknownConceptsContainer.appendChild(row);
    });

    categoryModal.classList.remove('hidden');
}

function processPendingTransactions() {
    pendingTransactions.forEach(t => {
        t.category = categoryMappings[t.rawCategory] || guessCategory(t.rawCategory) || t.rawCategory || 'Otros';
    });

    appData.transactions = pendingTransactions;

    if (appData.transactions.length > 0) {
        uploadStatus.textContent = `✅ Archivo cargado. Se leyeron ${appData.transactions.length} movimientos.`;
        uploadStatus.className = 'status-msg success';
        saveData(false);
        updateDashboard();
    } else {
        uploadStatus.textContent = '❌ No se reconoció ningún movimiento válido en el archivo.';
        uploadStatus.className = 'status-msg error';
    }
    pendingTransactions = [];
}

// ==========================================
// MODO CLARO / OSCURO
// ==========================================
const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    root.setAttribute('data-theme', newTheme);
    themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
    updateChartsColors();
};

themeToggle.addEventListener('click', toggleTheme);

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// ==========================================
// GUARDADO Y CARGA (AUTO-SAVE)
// ==========================================
const loadData = () => {
    const savedData = localStorage.getItem('finanzasData');
    if (savedData) {
        try {
            appData = JSON.parse(savedData);
            updateDashboard();
        } catch (e) {
            console.warn('No se pudo cargar el guardado anterior.', e);
        }
    }
};

const saveData = (showToastFlag = true) => {
    appData.lastSaved = new Date().getTime();
    localStorage.setItem('finanzasData', JSON.stringify(appData));
    if (showToastFlag) {
        showToastMessage('💾 Datos guardados automáticamente');
    }
};

// Autoguardado cada 5 minutos (300.000 ms)
setInterval(() => {
    if (appData.transactions.length > 0) {
        saveData(true);
    }
}, 300000);

function showToastMessage(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3200);
}

// ==========================================
// MODAL: LIMPIAR DATOS
// ==========================================
const confirmClearModal = document.getElementById('confirm-clear-modal');
const btnConfirmClear = document.getElementById('btn-confirm-clear');
const btnCancelClear = document.getElementById('btn-cancel-clear');
const deleteDateRange = document.getElementById('delete-date-range');
const deleteFrom = document.getElementById('delete-from');
const deleteTo = document.getElementById('delete-to');
const deletePreview = document.getElementById('delete-preview');
const deleteWarning = document.getElementById('delete-warning');
const deleteModeBtns = document.querySelectorAll('.delete-mode-btn');
let currentDeleteMode = 'all';

function updateDeletePreview() {
    if (currentDeleteMode !== 'range') return;
    const from = deleteFrom.value ? new Date(deleteFrom.value) : null;
    const to = deleteTo.value ? new Date(deleteTo.value + 'T23:59:59') : null;
    const count = appData.transactions.filter(t => {
        const d = new Date(t.date);
        return (!from || d >= from) && (!to || d <= to);
    }).length;
    deletePreview.textContent = count > 0
        ? `Se eliminarán ${count} movimiento(s) en ese rango.`
        : 'Ningún movimiento en ese rango.';
}

deleteModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        deleteModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDeleteMode = btn.dataset.mode;
        const isRange = currentDeleteMode === 'range';
        deleteDateRange.classList.toggle('hidden', !isRange);
        deleteWarning.textContent = isRange
            ? 'Solo se eliminarán los movimientos del rango indicado.'
            : 'Esta acción eliminará todos los movimientos y no se puede deshacer.';
        if (isRange) updateDeletePreview();
    });
});

deleteFrom.addEventListener('change', updateDeletePreview);
deleteTo.addEventListener('change', updateDeletePreview);

btnClearData.addEventListener('click', () => {
    // Resetear modal al abrirlo
    deleteModeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === 'all'));
    currentDeleteMode = 'all';
    deleteDateRange.classList.add('hidden');
    deletePreview.textContent = '';
    deleteWarning.textContent = 'Esta acción eliminará todos los movimientos y no se puede deshacer.';
    confirmClearModal.classList.remove('hidden');
});
btnCancelClear.addEventListener('click', () => {
    confirmClearModal.classList.add('hidden');
});
confirmClearModal.addEventListener('click', (e) => {
    if (e.target === confirmClearModal) confirmClearModal.classList.add('hidden');
});

btnConfirmClear.addEventListener('click', () => {
    if (currentDeleteMode === 'range') {
        const from = deleteFrom.value ? new Date(deleteFrom.value) : null;
        const to = deleteTo.value ? new Date(deleteTo.value + 'T23:59:59') : null;
        const before = appData.transactions.length;
        appData.transactions = appData.transactions.filter(t => {
            const d = new Date(t.date);
            return (from && d < from) || (to && d > to);
        });
        const removed = before - appData.transactions.length;
        saveData(false);
        updateDashboard();
        confirmClearModal.classList.add('hidden');
        showToastMessage(`🗑️ ${removed} movimiento(s) eliminados`);
        return;
    }

    appData.transactions = [];
    localStorage.removeItem('finanzasData');

    // Resetear totales
    totalIncomeElement.textContent = '0,00 €';
    totalExpensesElement.textContent = '0,00 €';
    totalBalanceElement.textContent = '0,00 €';
    totalBalanceElement.style.color = '';

    uploadStatus.textContent = '';
    uploadStatus.className = 'status-msg';
    fileInput.value = '';

    // Destruir gráficos
    if (expensesChart) { expensesChart.destroy(); expensesChart = null; }
    if (incomeChart) { incomeChart.destroy(); incomeChart = null; }
    if (evolutionChart) { evolutionChart.destroy(); evolutionChart = null; }

    // Ocultar tabla y botones de acción
    document.getElementById('transactions-section').style.display = 'none';
    btnExport.style.display = 'none';
    btnClearData.style.display = 'none';

    confirmClearModal.classList.add('hidden');
    showToastMessage('🗑️ Datos eliminados correctamente');
});

// ==========================================
// MODAL: AÑADIR MOVIMIENTO MANUAL
// ==========================================
const manualModal = document.getElementById('manual-modal');
const btnCloseManual = document.getElementById('btn-close-manual');
const manualForm = document.getElementById('manual-form');
const manualDate = document.getElementById('manual-date');
const manualConcept = document.getElementById('manual-concept');
const manualCategory = document.getElementById('manual-category');
const manualAmount = document.getElementById('manual-amount');
const amountSignBtn = document.getElementById('amount-sign-btn');

// Manejo de botones de tipo (Gasto / Ingreso / Traspaso)
const typeButtons = document.querySelectorAll('.type-btn');
let currentManualType = 'expense';
let currentAmountSign = -1;

function setAmountSign(sign) {
    currentAmountSign = sign;
    amountSignBtn.textContent = sign === 1 ? '+' : '−';
    amountSignBtn.classList.toggle('positive', sign === 1);
    amountSignBtn.classList.toggle('negative', sign === -1);
}

amountSignBtn.addEventListener('click', () => setAmountSign(currentAmountSign === -1 ? 1 : -1));

typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentManualType = btn.dataset.type;
        setAmountSign(btn.dataset.type === 'expense' ? -1 : 1);
    });
});

// Función para rellenar los selects de categorías
function refreshCategoryOptions() {
    // 1. Select para Formulario Manual
    if (manualCategory) {
        manualCategory.innerHTML = '';
        availableCategories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat; opt.textContent = cat;
            manualCategory.appendChild(opt);
        });
        const customOptManual = document.createElement('option');
        customOptManual.value = '__custom__';
        customOptManual.textContent = '✏️ Nueva categoría...';
        manualCategory.appendChild(customOptManual);
    }

    // 2. Select para Filtros (se actualiza también en updateTableFilters)
    updateTableFilters();
}

// Escuchar cambios en el select manual para mostrar campo de texto si es nueva categoría
const manualCustomInput = document.createElement('input');
manualCustomInput.type = 'text';
manualCustomInput.className = 'category-custom-input'; // Usar misma clase que el modal
manualCustomInput.placeholder = 'Nombre de la nueva categoría...';
manualCustomInput.style.display = 'none';
manualCustomInput.style.marginTop = '0.5rem';
manualCategory.parentNode.appendChild(manualCustomInput);

manualCategory.addEventListener('change', () => {
    manualCustomInput.style.display = manualCategory.value === '__custom__' ? 'block' : 'none';
});

// Inicializar selectores
refreshCategoryOptions();

// Fecha de hoy por defecto
const todayISO = new Date().toISOString().split('T')[0];
manualDate.value = todayISO;

// Función para abrir el modal (añadir o editar)
function openManualModal(editIdx = null) {
    editingTransactionIndex = editIdx;
    const title = document.getElementById('manual-modal-title');
    const submitBtn = document.getElementById('btn-submit-manual');

    if (editIdx !== null) {
        const t = appData.transactions[editIdx];
        title.textContent = "✏️ Editar Movimiento";
        submitBtn.textContent = "✅ Guardar Cambios";

        document.getElementById('manual-date').value = t.date.split('T')[0];
        document.getElementById('manual-concept').value = t.rawCategory || t.category;
        document.getElementById('manual-category').value = t.category;
        document.getElementById('manual-amount').value = Math.abs(t.amount);
        setAmountSign(t.amount >= 0 ? 1 : -1);

        // Activar el botón de tipo correspondiente
        typeButtons.forEach(b => b.classList.remove('active'));
        const activeBtn = Array.from(typeButtons).find(b => b.dataset.type === t.type);
        if (activeBtn) {
            activeBtn.classList.add('active');
            currentManualType = t.type;
        }
    } else {
        title.textContent = "➕ Añadir Movimiento";
        submitBtn.textContent = "✅ Añadir Movimiento";
        manualForm.reset();
        document.getElementById('manual-date').value = todayISO;
        // Reset a 'expense' por defecto
        typeButtons.forEach(b => b.classList.remove('active'));
        document.getElementById('type-expense').classList.add('active');
        currentManualType = 'expense';
        setAmountSign(-1);
    }

    manualModal.classList.remove('hidden');
}

btnAddManual.addEventListener('click', () => openManualModal());
btnCloseManual.addEventListener('click', () => {
    manualModal.classList.add('hidden');
    editingTransactionIndex = null;
});
manualModal.addEventListener('click', (e) => {
    if (e.target === manualModal) {
        manualModal.classList.add('hidden');
        editingTransactionIndex = null;
    }
});

manualForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const amount = parseFloat(manualAmount.value);
    if (isNaN(amount) || amount <= 0) {
        alert('Por favor, introduzca un importe válido mayor a 0.');
        return;
    }

    const finalAmount = currentAmountSign * Math.abs(amount);

    let chosenCategory = manualCategory.value;
    if (chosenCategory === '__custom__' && manualCustomInput.value.trim() !== '') {
        chosenCategory = manualCustomInput.value.trim();
        if (!availableCategories.includes(chosenCategory)) {
            availableCategories.push(chosenCategory);
            availableCategories.sort();
            saveCategories();
            refreshCategoryOptions();
        }
    } else if (chosenCategory === '__custom__') {
        chosenCategory = 'Otros';
    }

    const concept = manualConcept.value.trim();
    learnCategory(concept, chosenCategory);

    const transaction = {
        rawCategory: concept,
        category: chosenCategory,
        amount: finalAmount,
        date: new Date(manualDate.value).toISOString(),
        type: currentManualType,
        manual: true
    };

    if (editingTransactionIndex !== null) {
        appData.transactions[editingTransactionIndex] = transaction;
        showToastMessage('✅ Movimiento actualizado');
    } else {
        appData.transactions.push(transaction);
        showToastMessage('✅ Movimiento añadido correctamente');
    }

    saveData(false);
    updateDashboard();

    editingTransactionIndex = null;
    manualForm.reset();
    manualCustomInput.style.display = 'none';
    manualModal.classList.add('hidden');
});

// ==========================================
// LECTURA DE ARCHIVO (EXCEL Y CSV)
// ==========================================
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadStatus.textContent = '⏳ Leyendo archivo...';
    uploadStatus.className = 'status-msg';

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const reader = new FileReader();

    reader.onload = (event) => {
        try {
            if (isCSV) {
                parseCsvText(event.target.result);
            } else {
                parseExcelData(new Uint8Array(event.target.result));
            }
        } catch (error) {
            console.error('Error leyendo el archivo:', error);
            uploadStatus.textContent = '❌ Error al leer el archivo: ' + error.message;
            uploadStatus.className = 'status-msg error';
        }
    };

    reader.onerror = () => {
        uploadStatus.textContent = '❌ No se pudo leer el archivo. Compruebe que no esté abierto en otro programa.';
        uploadStatus.className = 'status-msg error';
    };

    if (isCSV) {
        reader.readAsText(file, 'UTF-8');
    } else {
        reader.readAsArrayBuffer(file);
    }
});

function parseCsvText(text) {
    const semicolonCount = (text.match(/;/g) || []).length;
    const commaCount = (text.match(/,/g) || []).length;
    const separator = semicolonCount > commaCount ? ';' : ',';

    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) {
        uploadStatus.textContent = '❌ El archivo CSV parece estar vacío o no tiene datos.';
        uploadStatus.className = 'status-msg error';
        return;
    }

    let headerLineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const ll = lines[i].toLowerCase();
        if ((ll.includes('concepto') || ll.includes('descrip')) &&
            (ll.includes('importe') || ll.includes('valor'))) {
            headerLineIndex = i; break;
        }
        if (ll.includes('fecha') && (ll.includes('importe') || ll.includes('valor'))) {
            headerLineIndex = i; break;
        }
    }

    const headers = lines[headerLineIndex]
        .split(separator)
        .map(h => h.trim().replace(/^"/, '').replace(/"$/, ''));

    const jsonData = [];
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const cells = lines[i]
            .split(separator)
            .map(c => c.trim().replace(/^"/, '').replace(/"$/, ''));
        if (cells.length < 2) continue;
        const rowObj = {};
        headers.forEach((header, idx) => { rowObj[header] = cells[idx] || ''; });
        jsonData.push(rowObj);
    }
    processExcelData(jsonData);
}

function parseExcelData(data) {
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let headerRowIndex = 0;
    for (let i = 0; i < rows.length; i++) {
        if (!rows[i] || rows[i].length === 0) continue;
        const rowStr = rows[i].join(' ').toLowerCase();
        if ((rowStr.includes('concepto') || rowStr.includes('descrip') || rowStr.includes('movimiento')) &&
            (rowStr.includes('importe') || rowStr.includes('valor') || rowStr.includes('cantidad'))) {
            headerRowIndex = i; break;
        }
        if (rowStr.includes('fecha') && (rowStr.includes('importe') || rowStr.includes('valor'))) {
            headerRowIndex = i; break;
        }
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });
    processExcelData(jsonData);
}

// ==========================================
// PROCESAMIENTO DE DATOS
// ==========================================
function processExcelData(data) {
    if (!data || data.length === 0) {
        uploadStatus.textContent = '❌ El archivo no tiene datos reconocibles.';
        uploadStatus.className = 'status-msg error';
        return;
    }

    const transactions = [];
    const unknownConcepts = new Map(); // Concepto -> Importe de ejemplo

    data.forEach(row => {
        const keys = Object.keys(row);
        let amount = NaN;
        let rawCategory = 'Sin Concepto';
        let date = new Date();

        // Detectar columna IMPORTE
        // Detectar columna IMPORTE (evitando fechas como "Fecha valor" o saldos)
        const amountKey = keys.find(k => {
            const kl = k.toLowerCase();
            if (kl.includes('fecha') || kl.includes('date') || kl.includes('saldo') || kl.includes('balance')) return false;
            return kl.includes('importe') || kl.includes('valor') || kl.includes('cantidad') || kl.includes('amount');
        });
        if (amountKey) {
            let rawAmt = String(row[amountKey]).trim();
            // Reemplazar diferentes tipos de guiones/signos menos por el estándar "-"
            // y limpiar símbolos de moneda y espacios
            rawAmt = rawAmt.replace(/[−–—]/g, '-').replace(/[€$\s]/g, '');

            // Lógica para detectar formato español (1.234,56)
            // Si hay puntos y comas, los puntos son miles y la coma es decimal
            if (rawAmt.includes('.') && rawAmt.includes(',')) {
                rawAmt = rawAmt.replace(/\./g, '').replace(',', '.');
            } else if (rawAmt.includes(',')) {
                // Si sólo hay comas, es el separador decimal (ej: 25,50)
                rawAmt = rawAmt.replace(',', '.');
            }
            // Importante: no eliminamos los puntos si no hay comas, 
            // ya que parseFloat interpreta el punto como decimal por defecto.

            amount = parseFloat(rawAmt);
        }

        // Detectar columna CONCEPTO
        const categoryKey = keys.find(k =>
            k.toLowerCase().includes('concepto') ||
            k.toLowerCase().includes('categor') ||
            k.toLowerCase().includes('descrip') ||
            k.toLowerCase().includes('movimiento') ||
            k.toLowerCase().includes('concept')
        );
        if (categoryKey && row[categoryKey]) {
            rawCategory = String(row[categoryKey]).trim();
        }

        // Detectar columna FECHA
        const dateKey = keys.find(k => {
            const kl = k.toLowerCase();
            return kl.includes('fecha') || kl.includes('date') || kl === 'f. valor' || kl === 'f. operación';
        });
        if (dateKey && row[dateKey] !== undefined && row[dateKey] !== '') {
            if (row[dateKey] instanceof Date) {
                date = row[dateKey];
            } else if (typeof row[dateKey] === 'number') {
                const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                date = new Date(excelEpoch.getTime() + row[dateKey] * 86400000);
                if (isNaN(date.getTime())) date = new Date();
            } else {
                const rawDate = String(row[dateKey]).trim();
                const parts = rawDate.split(/[\/\-]/);
                if (parts.length === 3) {
                    if (parts[0].length === 4) {
                        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    } else {
                        date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    }
                }
                if (isNaN(date.getTime())) date = new Date();
            }
        }

        if (!isNaN(amount) && amount !== 0) {
            const guessed = guessCategory(rawCategory);
            const mapped = categoryMappings[rawCategory];

            transactions.push({
                rawCategory,
                category: mapped || guessed || rawCategory,
                amount,
                date: date.toISOString(),
                type: amount > 0 ? 'income' : 'expense'
            });

            if (!mapped && !guessed) {
                if (!unknownConcepts.has(rawCategory)) {
                    unknownConcepts.set(rawCategory, amount);
                }
            }
        }
    });

    if (transactions.length === 0) {
        uploadStatus.textContent = '❌ No se encontraron movimientos con importe válido. Compruebe que el archivo tiene columnas de "Importe" y "Concepto".';
        uploadStatus.className = 'status-msg error';
        return;
    }

    pendingTransactions = transactions;

    if (unknownConcepts.size > 0) {
        uploadStatus.textContent = `🔍 Se encontraron ${unknownConcepts.size} concepto(s) nuevo(s). Asígneles una categoría para continuar.`;
        uploadStatus.className = 'status-msg';

        // Convertimos el Map en un array de objetos para el wizard
        const wizardData = Array.from(unknownConcepts.entries()).map(([concept, amount]) => ({
            concept,
            amount
        })).sort((a, b) => a.concept.localeCompare(b.concept));

        showCategoryWizard(wizardData);
    } else {
        processPendingTransactions();
    }
}

// ==========================================
// ACTUALIZACIÓN DEL PANEL PRINCIPAL
// ==========================================
function formatCurrency(value) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
}

function updateDashboard() {
    if (!appData.transactions) return;

    if (appData.transactions.length > 0) {
        btnExport.style.display = 'inline-flex';
        btnClearData.style.display = 'inline-flex';
        document.getElementById('transactions-section').style.display = 'block';
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    let countIncome = 0;
    let countExpenses = 0;
    const expensesByCategory = {};
    const incomeByCategory = {};
    const balanceByMonth = {};

    const filterMonthVal = document.getElementById('filter-month').value;
    const filterYearVal = document.getElementById('filter-year').value;

    appData.transactions.forEach(t => {
        if (t.type === 'transfer') return;

        // Filtrar por mes/año para los gráficos y totales si hay filtros activos
        const tDate = new Date(t.date);
        const tMonth = (tDate.getMonth() + 1).toString();
        const tYear = tDate.getFullYear().toString();

        if (filterMonthVal !== 'all' && tMonth !== filterMonthVal) return;
        if (filterYearVal !== 'all' && tYear !== filterYearVal) return;

        // Categorías que nunca deben aparecer en gastos por definición
        const incomeFixedCats = ['Ingresos Fijos', 'Otros Ingresos', 'Nómina', 'Ventas'];

        if (t.type === 'income') {
            totalIncome += t.amount;
            countIncome++;
            incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
        } else if (t.type === 'expense') {
            totalExpenses -= t.amount;
            countExpenses++;
            if (!incomeFixedCats.includes(t.category)) {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) - t.amount;
            }
        }

        const mk = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
        if (!balanceByMonth[mk]) balanceByMonth[mk] = { income: 0, expense: 0 };
        if (t.type === 'income') {
            balanceByMonth[mk].income += t.amount;
        } else if (t.type === 'expense') {
            balanceByMonth[mk].expense -= t.amount;
        }
    });

    const balance = totalIncome - totalExpenses;
    totalIncomeElement.textContent = formatCurrency(totalIncome);
    totalExpensesElement.textContent = formatCurrency(totalExpenses);
    totalBalanceElement.textContent = formatCurrency(balance);
    totalBalanceElement.style.color = balance >= 0 ? 'var(--income)' : 'var(--expense)';

    const elCountIncome = document.getElementById('count-income');
    const elCountExpenses = document.getElementById('count-expenses');
    const elCountBalance = document.getElementById('count-balance');
    if (elCountIncome) elCountIncome.textContent = countIncome > 0 ? `${countIncome} ingreso${countIncome !== 1 ? 's' : ''}` : '';
    if (elCountExpenses) elCountExpenses.textContent = countExpenses > 0 ? `${countExpenses} gasto${countExpenses !== 1 ? 's' : ''}` : '';
    if (elCountBalance) elCountBalance.textContent = (countIncome + countExpenses) > 0 ? `${countIncome + countExpenses} movimientos` : '';

    drawCharts(expensesByCategory, incomeByCategory, balanceByMonth);
    updateTableFilters();
    renderTable();
}

// ==========================================
// TABLA: FILTROS Y RENDERIZADO
// ==========================================
function updateTableFilters() {
    const filterCategory = document.getElementById('filter-category');
    const filterMonth = document.getElementById('filter-month');
    const filterYear = document.getElementById('filter-year');

    // Categorías con iconos
    const categories = [...new Set(appData.transactions.map(t => t.category))].sort();
    const currentCat = filterCategory.value;
    filterCategory.innerHTML = '<option value="all">Todas las categorías</option>';

    // Opción especial para ver los que el sistema no conoce bien
    const optReview = document.createElement('option');
    optReview.value = "__review__";
    optReview.textContent = "⚠️ Pendientes de Revisión";
    filterCategory.appendChild(optReview);

    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat; opt.textContent = `${getCategoryIcon(cat)} ${cat}`;
        filterCategory.appendChild(opt);
    });
    if (currentCat && [...filterCategory.options].some(o => o.value === currentCat)) {
        filterCategory.value = currentCat;
    }

    // Meses (Enero - Diciembre)
    const currentMonth = filterMonth.value;
    filterMonth.innerHTML = '<option value="all">Todos los meses</option>';
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    for (let i = 1; i <= 12; i++) {
        const opt = document.createElement('option');
        opt.value = i; opt.textContent = monthNames[i - 1];
        filterMonth.appendChild(opt);
    }
    if (currentMonth) filterMonth.value = currentMonth;

    // Años (dinámicos)
    const currentYear = filterYear.value;
    const years = [...new Set(appData.transactions.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a);
    filterYear.innerHTML = '<option value="all">Todos los años</option>';
    years.forEach(y => {
        if (!isNaN(y)) {
            const opt = document.createElement('option');
            opt.value = y; opt.textContent = y;
            filterYear.appendChild(opt);
        }
    });
    if (currentYear) filterYear.value = currentYear;
}

function getFilteredTransactions() {
    const filterTypeVal = document.getElementById('filter-type').value;
    const filterCategoryVal = document.getElementById('filter-category').value;
    const filterMonthVal = document.getElementById('filter-month').value;
    const filterYearVal = document.getElementById('filter-year').value;
    const filterSearch = document.getElementById('filter-search').value.toLowerCase().trim();
    const filterAmountMin = parseFloat(document.getElementById('filter-amount-min').value);
    const filterAmountMax = parseFloat(document.getElementById('filter-amount-max').value);

    let result = [...appData.transactions];

    if (filterTypeVal !== 'all') {
        result = result.filter(t => t.type === filterTypeVal);
    }
    if (filterCategoryVal !== 'all') {
        if (filterCategoryVal === "__review__") {
            result = result.filter(t => !categoryMappings[t.rawCategory] && !t.manual);
        } else {
            result = result.filter(t => t.category === filterCategoryVal);
        }
    }
    if (filterMonthVal !== 'all') {
        result = result.filter(t => (new Date(t.date).getMonth() + 1).toString() === filterMonthVal);
    }
    if (filterYearVal !== 'all') {
        result = result.filter(t => new Date(t.date).getFullYear().toString() === filterYearVal);
    }
    if (filterSearch) {
        result = result.filter(t =>
            (t.rawCategory && t.rawCategory.toLowerCase().includes(filterSearch)) ||
            (t.category && t.category.toLowerCase().includes(filterSearch))
        );
    }
    if (!isNaN(filterAmountMin)) {
        result = result.filter(t => Math.abs(t.amount) >= filterAmountMin);
    }
    if (!isNaN(filterAmountMax)) {
        result = result.filter(t => Math.abs(t.amount) <= filterAmountMax);
    }

    // Ordenar
    result.sort((a, b) => {
        let valA, valB;
        if (tableSortColumn === 'date') {
            valA = new Date(a.date).getTime();
            valB = new Date(b.date).getTime();
        } else {
            valA = Math.abs(a.amount);
            valB = Math.abs(b.amount);
        }
        return tableSortDir === 'asc' ? valA - valB : valB - valA;
    });

    return result;
}

function renderTable() {
    if (!appData.transactions || appData.transactions.length === 0) return;

    filteredTransactions = getFilteredTransactions();
    const total = filteredTransactions.length;
    const startIdx = (tableCurrentPage - 1) * tablePageSize;
    const endIdx = Math.min(startIdx + tablePageSize, total);
    const pageData = filteredTransactions.slice(startIdx, endIdx);

    const tbody = document.getElementById('transactions-tbody');
    tbody.innerHTML = '';

    if (pageData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" style="text-align:center; color:var(--text-muted); padding:2.5rem; font-size:0.95rem;">
            Sin resultados para los filtros seleccionados
        </td>`;
        tbody.appendChild(tr);
    } else {
        pageData.forEach((t, idx) => {
            const globalIdx = startIdx + idx;
            const d = new Date(t.date);
            const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const amountStr = formatCurrency(t.amount);
            let amountClass = 'expense-amount';
            let badgeClass = 'badge-expense';
            let badgeText = '📉 Gasto';

            if (t.type === 'income') {
                amountClass = 'income-amount';
                badgeClass = 'badge-income';
                badgeText = '📈 Ingreso';
            } else if (t.type === 'transfer') {
                amountClass = 'transfer-amount';
                badgeClass = 'badge-transfer';
                badgeText = '🔄 Traspaso';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(t.date).toLocaleDateString('es-ES')}</td>
                <td>
                    <div style="font-weight: 600;">${t.rawCategory || 'Sin concepto'}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${getCategoryIcon(t.category)} ${t.category}</div>
                </td>
                <td class="td-amount ${amountClass}">${amountStr}</td>
                <td><span class="badge-type ${badgeClass}">${badgeText}</span></td>
                <td>
                    <div style="display:flex; gap:0.5rem; justify-content:center;">
                        <button class="btn-row-action btn-row-split" data-index="${globalIdx}" title="Fraccionar movimiento">✂️</button>
                        <button class="btn-row-action btn-row-edit" data-index="${globalIdx}" title="Editar movimiento">✏️</button>
                        <button class="btn-row-action btn-row-delete" data-index="${globalIdx}" title="Eliminar movimiento">🗑️</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('table-count').textContent =
        `${total.toLocaleString('es-ES')} movimiento${total !== 1 ? 's' : ''}`;

    renderPagination(total);

    // Listener de edición
    tbody.querySelectorAll('.btn-row-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filteredIdx = parseInt(e.currentTarget.dataset.index);
            const transactionToEdit = filteredTransactions[filteredIdx];
            const realIdx = appData.transactions.indexOf(transactionToEdit);
            openManualModal(realIdx);
        });
    });

    // Listener de borrado por fila
    tbody.querySelectorAll('.btn-row-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filteredIdx = parseInt(e.currentTarget.dataset.index);
            const transactionToDelete = filteredTransactions[filteredIdx];
            const realIdx = appData.transactions.indexOf(transactionToDelete);
            if (realIdx > -1) {
                if (confirm('¿Seguro que desea eliminar este movimiento?')) {
                    appData.transactions.splice(realIdx, 1);
                    saveData(false);
                    updateDashboard();
                    showToastMessage('🗑️ Movimiento eliminado');
                }
            }
        });
    });

    // Listener de fraccionamiento
    tbody.querySelectorAll('.btn-row-split').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filteredIdx = parseInt(e.currentTarget.dataset.index);
            const transactionToSplit = filteredTransactions[filteredIdx];
            const realIdx = appData.transactions.indexOf(transactionToSplit);
            openSplitModal(realIdx);
        });
    });
}

function renderPagination(total) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    const totalPages = Math.ceil(total / tablePageSize);
    if (totalPages <= 1) return;

    if (tableCurrentPage > 1) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = '◀';
        btn.addEventListener('click', () => { tableCurrentPage--; renderTable(); });
        pagination.appendChild(btn);
    }

    const startPage = Math.max(1, tableCurrentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn${i === tableCurrentPage ? ' active' : ''}`;
        btn.textContent = i;
        const pg = i;
        btn.addEventListener('click', () => { tableCurrentPage = pg; renderTable(); });
        pagination.appendChild(btn);
    }

    if (tableCurrentPage < totalPages) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = '▶';
        btn.addEventListener('click', () => { tableCurrentPage++; renderTable(); });
        pagination.appendChild(btn);
    }
}

// Listeners de filtros
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');
const filterMonth = document.getElementById('filter-month');
const filterYear = document.getElementById('filter-year');
const filterSearch = document.getElementById('filter-search');

filterType.addEventListener('change', () => { tableCurrentPage = 1; updateDashboard(); });
filterCategory.addEventListener('change', () => { tableCurrentPage = 1; updateDashboard(); });
filterMonth.addEventListener('change', () => { tableCurrentPage = 1; updateDashboard(); });
filterYear.addEventListener('change', () => { tableCurrentPage = 1; updateDashboard(); });
filterSearch.addEventListener('input', () => { tableCurrentPage = 1; updateDashboard(); });
document.getElementById('filter-amount-min').addEventListener('input', () => { tableCurrentPage = 1; renderTable(); });
document.getElementById('filter-amount-max').addEventListener('input', () => { tableCurrentPage = 1; renderTable(); });

// Listeners de ordenación por columna
document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (tableSortColumn === col) {
            tableSortDir = tableSortDir === 'asc' ? 'desc' : 'asc';
        } else {
            tableSortColumn = col;
            tableSortDir = 'desc';
        }
        document.querySelectorAll('th.sortable').forEach(t => {
            t.classList.remove('active');
            t.querySelector('.sort-icon').textContent = '↕';
        });
        th.classList.add('active');
        th.querySelector('.sort-icon').textContent = tableSortDir === 'asc' ? '↑' : '↓';
        tableCurrentPage = 1;
        renderTable();
    });
});

// ==========================================
// LÓGICA DE FRACCIONAMIENTO
// ==========================================
const splitModal = document.getElementById('split-modal');
const btnCloseSplit = document.getElementById('btn-close-split');
const btnCancelSplit = document.getElementById('btn-cancel-split');
const btnSaveSplit = document.getElementById('btn-save-split');
const btnAddSplitRow = document.getElementById('btn-add-split-row');
const splitRowsContainer = document.getElementById('split-rows-container');
const splitOriginalAmountText = document.getElementById('split-original-amount');
const splitPendingAmountText = document.getElementById('split-pending-amount');

let splittingTransactionIndex = null;
let originalSplitAmount = 0;

function openSplitModal(realIdx) {
    splittingTransactionIndex = realIdx;
    const t = appData.transactions[realIdx];
    originalSplitAmount = Math.abs(t.amount);

    splitOriginalAmountText.textContent = formatCurrency(originalSplitAmount);
    splitRowsContainer.innerHTML = '';

    // Añadimos dos filas iniciales para empezar a fraccionar
    addSplitRow(t.category, originalSplitAmount);
    addSplitRow('Otros', 0);

    updateSplitCalculation();
    splitModal.classList.remove('hidden');
}

function addSplitRow(category = 'Otros', amount = 0) {
    const row = document.createElement('div');
    row.className = 'split-row-item';

    const select = document.createElement('select');
    select.className = 'form-input category-select';
    availableCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat; opt.textContent = cat;
        if (cat === category) opt.selected = true;
        select.appendChild(opt);
    });

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'form-input amount-input';
    input.step = '0.01';
    input.min = '0';
    input.value = amount.toFixed(2);
    input.placeholder = 'Importe';

    const btnDel = document.createElement('button');
    btnDel.className = 'btn-close';
    btnDel.textContent = '✕';
    btnDel.addEventListener('click', () => {
        row.remove();
        updateSplitCalculation();
    });

    input.addEventListener('input', updateSplitCalculation);
    select.addEventListener('change', updateSplitCalculation);

    row.appendChild(select);
    row.appendChild(input);
    row.appendChild(btnDel);
    splitRowsContainer.appendChild(row);
}

function updateSplitCalculation() {
    let currentTotal = 0;
    const inputs = splitRowsContainer.querySelectorAll('.amount-input');
    inputs.forEach(input => {
        currentTotal += parseFloat(input.value) || 0;
    });

    const pending = originalSplitAmount - currentTotal;
    splitPendingAmountText.textContent = formatCurrency(pending);

    if (Math.abs(pending) < 0.01) {
        splitPendingAmountText.className = 'correct';
        splitPendingAmountText.textContent = '✓ Total Ajustado';
        btnSaveSplit.disabled = false;
        btnSaveSplit.style.opacity = '1';
    } else {
        splitPendingAmountText.className = 'error';
        btnSaveSplit.disabled = true;
        btnSaveSplit.style.opacity = '0.5';
    }
}

btnAddSplitRow.addEventListener('click', () => addSplitRow());

btnSaveSplit.addEventListener('click', () => {
    const tOriginal = appData.transactions[splittingTransactionIndex];
    const rows = splitRowsContainer.querySelectorAll('.split-row-item');
    const newTransactions = [];

    rows.forEach(row => {
        const cat = row.querySelector('.category-select').value;
        const amt = parseFloat(row.querySelector('.amount-input').value) || 0;

        if (amt > 0) {
            newTransactions.push({
                ...tOriginal,
                category: cat,
                rawCategory: tOriginal.rawCategory + ` (${cat})`,
                amount: tOriginal.amount > 0 ? amt : -amt,
                manual: true
            });
        }
    });

    // Reemplazamos el original por los nuevos trozos
    appData.transactions.splice(splittingTransactionIndex, 1, ...newTransactions);

    saveData(false);
    updateDashboard();
    splitModal.classList.add('hidden');
    showToastMessage('✂️ Movimiento fraccionado correctamente');
});

btnCloseSplit.addEventListener('click', () => splitModal.classList.add('hidden'));
btnCancelSplit.addEventListener('click', () => splitModal.classList.add('hidden'));

// ==========================================
// MODAL: EXPORTAR DATOS
// ==========================================
const exportModal = document.getElementById('export-modal');
const btnCloseExport = document.getElementById('btn-close-export');
const btnExportCsv = document.getElementById('btn-export-csv');
const btnExportPrint = document.getElementById('btn-export-print');

btnExport.addEventListener('click', () => {
    exportModal.classList.remove('hidden');
});
btnCloseExport.addEventListener('click', () => {
    exportModal.classList.add('hidden');
});
exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) exportModal.classList.add('hidden');
});

btnExportCsv.addEventListener('click', () => {
    exportToCSV();
    exportModal.classList.add('hidden');
});
btnExportPrint.addEventListener('click', () => {
    exportModal.classList.add('hidden');
    setTimeout(() => window.print(), 350);
});

function exportToCSV() {
    if (appData.transactions.length === 0) return;

    const headers = ['Fecha', 'Concepto', 'Categoría', 'Tipo', 'Importe (€)'];

    const rows = [...appData.transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(t => {
            const d = new Date(t.date);
            const dateStr = d.toLocaleDateString('es-ES');
            const type = t.type === 'income' ? 'Ingreso' : 'Gasto';
            const sign = t.type === 'income' ? '' : '-';
            const amount = `${sign}${Math.abs(t.amount).toFixed(2).replace('.', ',')}`;
            return [dateStr, t.rawCategory || t.category, t.category, type, amount];
        });

    const totalIncome = appData.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = appData.transactions.filter(t => t.type !== 'income').reduce((s, t) => s - t.amount, 0);
    const balance = totalIncome - totalExpenses;

    const allRows = [
        headers,
        ...rows,
        [],
        ['', '', '', 'INGRESOS TOTALES', totalIncome.toFixed(2).replace('.', ',')],
        ['', '', '', 'GASTOS TOTALES', `-${totalExpenses.toFixed(2).replace('.', ',')}`],
        ['', '', '', 'BALANCE', balance.toFixed(2).replace('.', ',')]
    ];

    const csvContent = allRows
        .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');

    // BOM para compatibilidad con Excel en español
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fecha = new Date().toISOString().split('T')[0];
    a.download = `Finanzas_Personales_${fecha}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToastMessage('📄 CSV exportado correctamente');
}

let currentExpensesChartType = 'doughnut';
let currentIncomeChartType = 'doughnut';

function initChartControls() {
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chartId = btn.closest('.chart-controls').dataset.chartId;
            const type = btn.dataset.type;

            if (chartId === 'expenses') {
                currentExpensesChartType = type;
            } else {
                currentIncomeChartType = type;
            }

            // Actualizar UI de botones
            btn.parentElement.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            updateDashboard();
        });
    });
}
initChartControls();

// ==========================================
// GRÁFICOS
// ==========================================
Chart.defaults.font.family = "'Outfit', sans-serif";

function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        text: isDark ? '#f8fafc' : '#0f172a',
        grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
    };
}

function updateChartsColors() {
    if (appData.transactions && appData.transactions.length > 0) {
        updateDashboard();
    }
}

function drawCharts(expensesMap, incomeMap, monthsMap) {
    const colors = getChartColors();
    const hasExpenses = Object.keys(expensesMap).length > 0;
    const hasIncome = Object.keys(incomeMap).length > 0;

    const getOptions = (type) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: type !== 'bar', // En barras a veces es redundante si solo hay un set
                position: 'right',
                labels: { color: colors.text, boxWidth: 12, font: { size: 11 }, padding: 10 }
            },
            tooltip: {
                callbacks: { label: (item) => ` ${item.label || item.dataset.label}: ${formatCurrency(item.raw)}` }
            }
        },
        scales: type === 'bar' ? {
            y: { grid: { color: colors.grid }, ticks: { color: colors.text, font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: colors.text, font: { size: 10 } } }
        } : {}
    });

    const chartPalette = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
        '#06b6d4', '#a855f7', '#f43f5e', '#22d3ee'
    ];

    // Gráfico de Gastos
    const ctxExp = document.getElementById('expenses-chart').getContext('2d');
    if (expensesChart) expensesChart.destroy();
    if (hasExpenses) {
        expensesChart = new Chart(ctxExp, {
            type: currentExpensesChartType,
            data: {
                labels: Object.keys(expensesMap),
                datasets: [{
                    label: 'Gasto Total',
                    data: Object.values(expensesMap),
                    backgroundColor: chartPalette,
                    borderWidth: 2,
                    borderColor: 'transparent'
                }]
            },
            options: getOptions(currentExpensesChartType)
        });
    }

    // Gráfico de Ingresos
    const ctxInc = document.getElementById('income-chart').getContext('2d');
    if (incomeChart) incomeChart.destroy();
    if (hasIncome) {
        incomeChart = new Chart(ctxInc, {
            type: currentIncomeChartType,
            data: {
                labels: Object.keys(incomeMap),
                datasets: [{
                    label: 'Ingreso Total',
                    data: Object.values(incomeMap),
                    backgroundColor: chartPalette,
                    borderWidth: 2,
                    borderColor: 'transparent'
                }]
            },
            options: getOptions(currentIncomeChartType)
        });
    }

    // Gráfico de Evolución Mensual (barras + línea)
    const sortedMonths = Object.keys(monthsMap).sort();
    const evolutionIncomes = sortedMonths.map(m => monthsMap[m].income);
    const evolutionExpenses = sortedMonths.map(m => monthsMap[m].expense);
    const evolutionBalance = sortedMonths.map(m => monthsMap[m].income - monthsMap[m].expense);

    const monthLabels = sortedMonths.map(m => {
        const [year, month] = m.split('-');
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
        return d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    });

    const ctxEvo = document.getElementById('evolution-chart').getContext('2d');
    if (evolutionChart) evolutionChart.destroy();
    evolutionChart = new Chart(ctxEvo, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: evolutionIncomes,
                    backgroundColor: 'rgba(16, 185, 129, 0.75)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 6,
                    order: 2
                },
                {
                    label: 'Gastos',
                    data: evolutionExpenses,
                    backgroundColor: 'rgba(239, 68, 68, 0.75)',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderRadius: 6,
                    order: 2
                },
                {
                    label: 'Balance',
                    data: evolutionBalance,
                    type: 'line',
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: '#3b82f6',
                    tension: 0.4,
                    fill: false,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
                },
                y: {
                    grid: { color: colors.grid },
                    ticks: {
                        color: colors.text,
                        callback: (value) => formatCurrency(value)
                    }
                }
            },
            plugins: {
                legend: { labels: { color: colors.text } },
                tooltip: {
                    callbacks: { label: (item) => ` ${item.dataset.label}: ${formatCurrency(item.raw)}` }
                }
            }
        }
    });
}

// ==========================================
// INICIO: Cargar datos guardados
// ==========================================
loadData();
