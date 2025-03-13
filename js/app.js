// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.error('ServiceWorker registration failed:', err);
            });
    });
}

// App State Management
const AppState = {
    currentUser: null,
    isOnline: navigator.onLine,
    pendingSyncs: [],
    currentRoute: '/',
};

// Router Configuration
const routes = {
    '/': {
        title: 'Dashboard',
        render: renderDashboard
    },
    '/nova-vistoria': {
        title: 'Nova Vistoria',
        render: renderNewInspection
    },
    '/agendamentos': {
        title: 'Agendamentos',
        render: renderScheduling
    },
    '/clientes': {
        title: 'Clientes',
        render: renderClients
    },
    '/historico': {
        title: 'Histórico',
        render: renderHistory
    }
};

// Router Implementation
window.navigateTo = function(path) {
    const route = routes[path];
    if (!route) {
        console.error('Route not found:', path);
        return;
    }

    window.history.pushState({}, route.title, '#' + path);
    updateUI(path);
}

function updateUI(path) {
    const route = routes[path];
    document.title = `${route.title} - Vistoria Brasilit`;
    AppState.currentRoute = path;
    route.render();
}

// Event Listeners
window.addEventListener('popstate', () => {
    const path = window.location.hash.slice(1) || '/';
    updateUI(path);
});

// Online/Offline Detection
window.addEventListener('online', handleOnlineStatus);
window.addEventListener('offline', handleOnlineStatus);

function handleOnlineStatus(event) {
    AppState.isOnline = navigator.onLine;
    const offlineIndicator = document.querySelector('.offline-indicator');
    
    if (!AppState.isOnline) {
        offlineIndicator.classList.add('visible');
        showToast('Você está offline. Os dados serão sincronizados quando a conexão for restabelecida.', 'warning');
    } else {
        offlineIndicator.classList.remove('visible');
        showToast('Conexão restabelecida. Sincronizando dados...', 'success');
        syncPendingData();
    }
}

// UI Components
function renderDashboard() {
    const mainContent = document.getElementById('app');
    mainContent.innerHTML = `
        <div class="px-4 py-6 sm:px-0">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <!-- Nova Vistoria Card -->
                <div class="dashboard-card bg-white overflow-hidden shadow rounded-lg cursor-pointer" onclick="navigateTo('/nova-vistoria')">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                <i class="fas fa-clipboard-list text-white"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">
                                        Nova Vistoria
                                    </dt>
                                    <dd class="flex items-baseline">
                                        <div class="text-2xl font-semibold text-gray-900">
                                            Iniciar
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Agendamentos Card -->
                <div class="dashboard-card bg-white overflow-hidden shadow rounded-lg cursor-pointer" onclick="navigateTo('/agendamentos')">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
                                <i class="fas fa-calendar text-white"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">
                                        Agendamentos
                                    </dt>
                                    <dd class="flex items-baseline">
                                        <div class="text-2xl font-semibold text-gray-900">
                                            Ver Agenda
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Vistorias Pendentes Card -->
                <div class="dashboard-card bg-white overflow-hidden shadow rounded-lg">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                                <i class="fas fa-clock text-white"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">
                                        Vistorias Pendentes
                                    </dt>
                                    <dd class="flex items-baseline">
                                        <div class="text-2xl font-semibold text-gray-900">
                                            3
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Histórico Card -->
                <div class="dashboard-card bg-white overflow-hidden shadow rounded-lg cursor-pointer" onclick="navigateTo('/historico')">
                    <div class="p-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 bg-purple-500 rounded-md p-3">
                                <i class="fas fa-history text-white"></i>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                                <dl>
                                    <dt class="text-sm font-medium text-gray-500 truncate">
                                        Histórico
                                    </dt>
                                    <dd class="flex items-baseline">
                                        <div class="text-2xl font-semibold text-gray-900">
                                            Ver Todos
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Statistics Section -->
            <div class="mt-8">
                <h2 class="text-lg font-medium text-gray-900">Resumo de Vistorias</h2>
                <div class="mt-4 bg-white shadow rounded-lg p-6">
                    <canvas id="statisticsChart"></canvas>
                </div>
            </div>
        </div>
    `;

    // Initialize statistics chart (placeholder)
    initializeStatisticsChart();
}

// Scheduling page render function
function renderScheduling() {
    const mainContent = document.getElementById('app');
    mainContent.innerHTML = `
        <div class="px-4 py-6 sm:px-0">
            <h1 class="text-2xl font-semibold text-gray-900 mb-6">Agendamentos</h1>
            <div class="bg-white shadow rounded-lg p-6">
                <div class="calendar-wrapper">
                    <!-- Calendar will be initialized here -->
                    <div id="calendar"></div>
                </div>
            </div>
        </div>
    `;
}

// Clients page render function
function renderClients() {
    const mainContent = document.getElementById('app');
    mainContent.innerHTML = `
        <div class="px-4 py-6 sm:px-0">
            <h1 class="text-2xl font-semibold text-gray-900 mb-6">Clientes</h1>
            <div class="bg-white shadow rounded-lg p-6">
                <div class="mb-4">
                    <input type="text" 
                           placeholder="Buscar clientes..." 
                           class="form-input w-full sm:w-64"
                           id="searchClients">
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nome
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cidade
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Última Vistoria
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <!-- Client rows will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// History page render function
function renderHistory() {
    const mainContent = document.getElementById('app');
    mainContent.innerHTML = `
        <div class="px-4 py-6 sm:px-0">
            <h1 class="text-2xl font-semibold text-gray-900 mb-6">Histórico de Vistorias</h1>
            <div class="bg-white shadow rounded-lg p-6">
                <div class="mb-4 flex flex-wrap gap-4">
                    <input type="text" 
                           placeholder="Buscar vistorias..." 
                           class="form-input w-full sm:w-64"
                           id="searchInspections">
                    <select class="form-input w-full sm:w-48" id="filterStatus">
                        <option value="">Todos os status</option>
                        <option value="completed">Concluídas</option>
                        <option value="pending">Pendentes</option>
                    </select>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Data
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <!-- History rows will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderNewInspection() {
    const mainContent = document.getElementById('app');
    mainContent.innerHTML = `
        <div class="px-4 py-6 sm:px-0">
            <h1 class="text-2xl font-semibold text-gray-900 mb-6">Nova Vistoria</h1>
            
            <!-- Progress Steps -->
            <div class="progress-steps mb-8">
                <div class="progress-step active">
                    <div class="step-indicator">1</div>
                    <span class="text-sm">Informações Básicas</span>
                </div>
                <div class="progress-step">
                    <div class="step-indicator">2</div>
                    <span class="text-sm">Produtos</span>
                </div>
                <div class="progress-step">
                    <div class="step-indicator">3</div>
                    <span class="text-sm">Não Conformidades</span>
                </div>
                <div class="progress-step">
                    <div class="step-indicator">4</div>
                    <span class="text-sm">Fotos</span>
                </div>
                <div class="progress-step">
                    <div class="step-indicator">5</div>
                    <span class="text-sm">Relatório</span>
                </div>
            </div>

            <!-- Form -->
            <form id="inspectionForm" class="space-y-6">
                <div class="bg-white shadow rounded-lg p-6">
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div class="form-group">
                            <label class="form-label" for="clientName">Nome do Cliente</label>
                            <input type="text" id="clientName" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="inspectionType">Tipo de Empreendimento</label>
                            <select id="inspectionType" class="form-input" required>
                                <option value="">Selecione...</option>
                                <option value="residential">Residencial</option>
                                <option value="commercial">Comercial</option>
                                <option value="industrial">Industrial</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="address">Endereço</label>
                            <input type="text" id="address" class="form-input" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="city">Cidade</label>
                            <input type="text" id="city" class="form-input" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="state">Estado</label>
                            <select id="state" class="form-input" required>
                                <option value="">Selecione...</option>
                                <option value="SP">São Paulo</option>
                                <option value="RJ">Rio de Janeiro</option>
                                <!-- Add other states -->
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="protocol">Protocolo FAR</label>
                            <input type="text" id="protocol" class="form-input" required>
                        </div>
                    </div>

                    <div class="mt-6 flex justify-end">
                        <button type="button" class="btn btn-secondary mr-3" onclick="navigateTo('/')">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Próximo</button>
                    </div>
                </div>
            </form>
        </div>
    `;

    // Add form submission handler
    document.getElementById('inspectionForm').addEventListener('submit', handleInspectionFormSubmit);
}

// Utility Functions
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function initializeStatisticsChart() {
    // Implement chart initialization using a charting library
    console.log('Statistics chart initialized');
}

function handleInspectionFormSubmit(event) {
    event.preventDefault();
    // Implement form submission logic
    console.log('Form submitted');
}

function syncPendingData() {
    if (AppState.pendingSyncs.length > 0) {
        // Implement sync logic
        console.log('Syncing pending data...');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Set initial route
    const path = window.location.pathname === '/' ? '/' : window.location.hash.slice(1) || '/';
    navigateTo(path);

    // Add offline indicator to DOM
    const offlineIndicator = document.createElement('div');
    offlineIndicator.className = 'offline-indicator';
    offlineIndicator.textContent = 'Você está offline';
    document.body.appendChild(offlineIndicator);

    // Check initial online status
    handleOnlineStatus();
});
