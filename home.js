class ProjectStorage {
    constructor() {
        this.storageKey = 'animeDB_project';
        this.projects = this.loadProjects();
    }

    loadProjects() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || [];
    }

    saveProjects() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.projects));
    }

    async createGitHubRepo(projectName, token) {
    // Substitua a chamada direta por uma API route do Next.js/Vercel
    try {
        const response = await fetch('create-repo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectName: projectName.toLowerCase().replace(/ /g, '-'),
                token: token
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao criar repositório');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro na criação do repositório:', error);
        throw new Error('Falha na comunicação com o servidor. Tente novamente.');
    }
}

    async addProject(projectData) {
        try {
            const repo = await this.createGitHubRepo(projectData.name, projectData.githubToken);
            
            const newProject = {
                ...projectData,
                repoUrl: repo.html_url,
                repoName: repo.full_name,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                ip: this.generateFakeIP()
            };

            this.projects.push(newProject);
            this.saveProjects();
            return newProject;

        } catch (error) {
            console.error('Erro na criação do repositório:', error);
            throw error;
        }
    }

    updateProject(id, updates) {
        const project = this.projects.find(p => p.id === id);
        if (project) {
            Object.assign(project, updates);
            project.lastModified = new Date().toISOString();
            this.saveProjects();
        }
        return project;
    }

    deleteProject(id) {
        this.projects = this.projects.filter(p => p.id !== id);
        this.saveProjects();
    }

    generateFakeIP() {
        return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }
}

class ProjectUI {
    constructor(storage) {
        this.storage = storage;
        this.currentStep = 1;
        this.currentProject = null;

        this.elements = {
            projectsList: document.getElementById('projectsList'),
            projectModal: document.getElementById('projectModal'),
            detailsModal: document.getElementById('detailsModal'),
            newProjectBtn: document.getElementById('newProjectBtn'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            closeDetailsBtn: document.getElementById('closeDetailsBtn'),
            prevStepBtn: document.getElementById('prevStepBtn'),
            nextStepBtn: document.getElementById('nextStepBtn'),
            createBtn: document.getElementById('createBtn'),
            projectName: document.getElementById('projectName'),
            projectDescription: document.getElementById('projectDescription'),
            githubToken: document.getElementById('githubToken'),
            agreeTerms: document.getElementById('agreeTerms'),
            projectTitle: document.getElementById('projectTitle'),
            projectDesc: document.getElementById('projectDesc'),
            projectCreated: document.getElementById('projectCreated'),
            projectModified: document.getElementById('projectModified'),
            projectRepo: document.getElementById('projectRepo'),
            deleteProjectBtn: document.getElementById('deleteProjectBtn'),
            editProjectBtn: document.getElementById('editProjectBtn')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderProjects();
    }

    setupEventListeners() {
        this.elements.newProjectBtn.addEventListener('click', (e) => this.showModal(e));
        this.elements.closeModalBtn.addEventListener('click', (e) => this.hideModal(e));
        this.elements.closeDetailsBtn.addEventListener('click', (e) => this.hideDetailsModal(e));
        this.elements.nextStepBtn.addEventListener('click', (e) => this.nextStep(e));
        this.elements.prevStepBtn.addEventListener('click', (e) => this.prevStep(e));
        this.elements.createBtn.addEventListener('click', (e) => this.createProject(e));
        this.elements.deleteProjectBtn.addEventListener('click', (e) => this.deleteProject(e));
        this.elements.editProjectBtn.addEventListener('click', (e) => this.editProject(e));
    }

    showModal() {
        this.elements.projectModal.classList.remove('hidden');
        this.resetForm();
    }

    hideModal() {
        this.elements.projectModal.classList.add('hidden');
        this.currentStep = 1;
        this.updateStepVisibility();
    }

    nextStep(e) {
        e.preventDefault();
        
        if (this.currentStep === 1 && !this.validateStep1()) return;
        if (this.currentStep === 2 && !this.validateStep2()) return;

        this.currentStep++;
        this.updateStepVisibility();
    }

    prevStep(e) {
        e.preventDefault();
        this.currentStep--;
        this.updateStepVisibility();
    }

    validateStep1() {
        if (!this.elements.projectName.value.trim()) {
            alert('Por favor, insira um nome para o projeto');
            return false;
        }
        return true;
    }

    validateStep2() {
        const token = this.elements.githubToken.value;
        if (!token || !token.startsWith('ghp_')) {
            alert('Token do GitHub inválido! Deve começar com ghp_');
            return false;
        }
        return true;
    }

    updateStepVisibility() {
        document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`step${this.currentStep}`).classList.remove('hidden');

        this.elements.prevStepBtn.classList.toggle('hidden', this.currentStep === 1);
        this.elements.nextStepBtn.classList.toggle('hidden', this.currentStep === 3);
        this.elements.createBtn.classList.toggle('hidden', this.currentStep !== 3);

        if (this.currentStep === 3) {
            this.elements.projectRepo.textContent = this.storage.projects.find(p => p.name === this.elements.projectName.value)?.repoUrl || '';
        }
    }

    async createProject(e) {
    e.preventDefault();
    
    if (!this.elements.agreeTerms.checked) {
        alert('Você deve aceitar os termos de serviço!');
        return;
    }

    // Mostrar loading
    this.elements.createBtn.disabled = true;
    this.elements.createBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Criando...';

    const projectData = {
        name: this.elements.projectName.value.trim(),
        description: this.elements.projectDescription.value.trim(),
        githubToken: this.elements.githubToken.value
    };

    try {
        await this.storage.addProject(projectData);
        this.hideModal();
        this.renderProjects();
    } catch (error) {
        alert(`Erro ao criar projeto: ${error.message}`);
    } finally {
        // Restaurar botão
        this.elements.createBtn.disabled = false;
        this.elements.createBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Criar Projeto';
    }
}

    renderProjects() {
        this.elements.projectsList.innerHTML = '';
        
        this.storage.projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card rounded-lg p-4 flex items-center fade-in cursor-pointer group';
            projectCard.innerHTML = `
                <div class="bg-red-600 p-3 rounded-lg mr-4">
                    <i class="fas fa-database text-white"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold">${project.name}</h4>
                    <p class="text-gray-400 text-sm">${new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
                <button class="edit-btn opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white p-2" data-id="${project.id}">
                    <i class="fas fa-pencil-alt"></i>
                </button>
            `;
            
            projectCard.addEventListener('click', () => {
                localStorage.setItem('currentProject', JSON.stringify(project));
                window.location.href = `dashboard.html?id=${project.id}`;
            });
            
            projectCard.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showProjectDetails(this.storage.projects.find(p => p.id === e.currentTarget.dataset.id));
            });
            
            this.elements.projectsList.appendChild(projectCard);
        });

        if (this.storage.projects.length === 0) {
            this.elements.projectsList.innerHTML = `
                <div class="col-span-full text-center py-10 text-gray-500">
                    <i class="fas fa-database text-4xl mb-3"></i>
                    <p>Nenhum projeto encontrado</p>
                    <button id="createFirstProjectBtn" class="mt-4 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md">
                        <i class="fas fa-plus mr-2"></i> Criar Primeiro Projeto
                    </button>
                </div>
            `;
            
            document.getElementById('createFirstProjectBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal();
            });
        }
    }

    showProjectDetails(project) {
        this.elements.projectTitle.textContent = project.name;
        this.elements.projectDesc.textContent = project.description;
        this.elements.projectCreated.textContent = new Date(project.createdAt).toLocaleString();
        this.elements.projectModified.textContent = new Date(project.lastModified).toLocaleString();
        this.elements.projectRepo.textContent = project.repoUrl;
        this.currentProject = project;
        this.elements.detailsModal.classList.remove('hidden');
    }

    hideDetailsModal() {
        this.elements.detailsModal.classList.add('hidden');
        this.currentProject = null;
    }

    deleteProject() {
        if (this.currentProject && confirm('Tem certeza que deseja excluir este projeto?')) {
            this.storage.deleteProject(this.currentProject.id);
            this.hideDetailsModal();
            this.renderProjects();
        }
    }

    editProject() {
        if (this.currentProject) {
            alert('Funcionalidade de edição ainda não implementada');
        }
    }

    resetForm() {
        this.elements.projectName.value = '';
        this.elements.projectDescription.value = '';
        this.elements.githubToken.value = '';
        this.elements.agreeTerms.checked = false;
        this.currentStep = 1;
        this.updateStepVisibility();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        const storage = new ProjectStorage();
        new ProjectUI(storage);
    } catch (error) {
        console.error('Erro na inicialização:', error);
        alert(`Erro crítico: ${error.message}. Recarregue a página.`);
    }
});
