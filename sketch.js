
        // Variáveis globais do jogo
        let arvores = [];
        let temperatura = 45;
        let qualidadeAr = 50;
        let recursos = 100;
        let tempo = 0;
        let estadoJogo = 'jogando';
        let poluicao = [];
        let nivel = 1;
        let contadorArvores = 0;
        let metaArvores = 10;
        let terreno = [];
        let TAMANHO_CELULA = 40;
        let celulaSelecionada = null;
        let tooltip = null;
        let canvas;
        let mostrarMensagemNivel = 0;
        let totalArvoresPlantadas = 0;
        let proximaMeta = 15; // Próxima meta após o nível 1

        const TIPOS_ARVORES = [
            { nome: "Árvore", corCopa: [34, 139, 34], corTronco: [101, 67, 33], alturaMin: 50, alturaMax: 90, efeito: 1.0 }
        ];

        function setup() {
            TAMANHO_CELULA = Math.min(40, windowWidth / 12);
            
            canvas = createCanvas(windowWidth, windowHeight);
            canvas.position(0, 0);
            canvas.style('display', 'block');
            tooltip = document.getElementById('fertilidade-tooltip');
            
            textSize(16);
            textAlign(LEFT, TOP);
            
            criarTerreno();
            
            for (let i = 0; i < 5; i++) {
                criarPoluicao();
            }
            
            mostrarMensagemNivel = 60; // Mostrar mensagem do nível por 1 segundo
        }

        function criarTerreno() {
            terreno = [];
            const colunas = Math.floor(width / TAMANHO_CELULA);
            const linhas = Math.floor((height * 0.8) / TAMANHO_CELULA); // Aumentei o espaço para mais árvores
            
            for (let y = 0; y < linhas; y++) {
                for (let x = 0; x < colunas; x++) {
                    terreno.push({
                        x: x * TAMANHO_CELULA,
                        y: height/4 + y * TAMANHO_CELULA,
                        disponivel: true,
                        fertilidade: Math.floor(Math.random() * 50) + 50
                    });
                }
            }
        }

        function draw() {
            let tempColor = map(temperatura, 20, 50, 50, 255);
            background(tempColor, 100, 100 - tempColor/3);
            
            desenharSol();
            desenharTerreno();
            desenharArvores();
            desenharPoluicao();
            desenharHUD();
            
            if (estadoJogo === 'jogando') {
                atualizarJogo();
                verificarEstadoJogo();
            }
            
            if (mostrarMensagemNivel > 0) {
                mostrarMensagemNivel--;
                fill(255, 230);
                rect(width/2 - 150, height/2 - 30, 300, 60, 10);
                fill(46, 139, 87);
                textSize(24);
                textStyle(BOLD);
                textAlign(CENTER, CENTER);
                text(`Nível ${nivel}`, width/2, height/2 - 10);
                textAlign(LEFT, BASELINE);
            }
            
            if (estadoJogo === 'proximo-nivel') {
                mostrarMensagemNivelCompleto();
            } else if (estadoJogo === 'derrota') {
                mostrarMensagemFinal("DERROTA! Planeta superaqueceu!", color(178, 34, 34));
            } else if (estadoJogo === 'vitoria') {
                mostrarMensagemFinal("VITÓRIA! Planeta resfriado!", color(46, 139, 87));
            }
            
            atualizarTooltip();
        }

        function desenharSol() {
            let solSize = map(temperatura, 20, 50, 80, 180);
            fill(255, 204, 0);
            noStroke();
            ellipse(width/2, 100, solSize);
            
            for (let i = 0; i < 12; i++) {
                push();
                translate(width/2, 100);
                rotate(i * PI/6);
                fill(255, 204, 0, 150);
                noStroke();
                rect(solSize/2 - 10, -5, solSize/2, 10);
                pop();
            }
        }

        function desenharTerreno() {
            for (let celula of terreno) {
                let fertilidadeColor = map(celula.fertilidade, 50, 100, 100, 200);
                if (celula.disponivel) {
                    fill(139, 69, 19, fertilidadeColor);
                } else {
                    fill(139, 69, 19, 100);
                }
                rect(celula.x, celula.y, TAMANHO_CELULA, TAMANHO_CELULA, 5);
                
                if (celula === celulaSelecionada) {
                    fill(255, 255, 255, 50);
                    rect(celula.x, celula.y, TAMANHO_CELULA, TAMANHO_CELULA, 5);
                }
            }
        }

        function atualizarTooltip() {
            tooltip.style.display = 'none';
            celulaSelecionada = null;
            
            for (let celula of terreno) {
                if (mouseX > celula.x && mouseX < celula.x + TAMANHO_CELULA &&
                    mouseY > celula.y && mouseY < celula.y + TAMANHO_CELULA) {
                    
                    celulaSelecionada = celula;
                    tooltip.textContent = `Fertilidade: ${celula.fertilidade}%`;
                    tooltip.style.display = 'block';
                    tooltip.style.left = `${Math.min(mouseX + 15, windowWidth - 130)}px`;
                    tooltip.style.top = `${mouseY + 15}px`;
                    break;
                }
            }
        }

        function desenharArvores() {
            for (let i = arvores.length - 1; i >= 0; i--) {
                let arvore = arvores[i];
                let tipo = TIPOS_ARVORES[0];
                
                // Tronco
                fill(tipo.corTronco);
                rect(arvore.x - 5, arvore.y - arvore.altura * 0.4 * arvore.crescimento, 
                     10, arvore.altura * 0.4 * arvore.crescimento, 3);
                
                let crescimentoFertilidade = map(arvore.fertilidade, 50, 100, 0.8, 1.2);
                let tamanhoCopa = arvore.altura * 0.6 * arvore.crescimento * crescimentoFertilidade;
                fill(tipo.corCopa);
                ellipse(arvore.x, arvore.y - arvore.altura * 0.4 * arvore.crescimento, tamanhoCopa);
                
                arvore.crescimento = Math.min(1, arvore.crescimento + 0.003 * (arvore.fertilidade / 100));
            }
        }

        function desenharPoluicao() {
            for (let i = poluicao.length - 1; i >= 0; i--) {
                let pol = poluicao[i];
                
                fill(120, 120, 120, pol.opacidade);
                noStroke();
                ellipse(pol.x, pol.y, pol.tamanho);
                
                pol.y += pol.velocidade;
                
                if (pol.y > height) {
                    temperatura = Math.min(50, temperatura + 0.05 * nivel);
                    qualidadeAr = Math.max(0, qualidadeAr - 0.5 * nivel);
                    poluicao.splice(i, 1);
                    criarPoluicao();
                }
            }
        }

        function desenharHUD() {
            let panelWidth = Math.min(300, width * 0.6);
            fill(255, 230);
            rect(10, 10, panelWidth, 140, 10);
            
            fill(0);
            textSize(16);
            textStyle(BOLD);
            text("🌍 REFLORESTE E RESFRIA 🌳", 20, 30);
            textStyle(NORMAL);
            
            fill(temperatura > 35 ? color(200, 0, 0) : color(0));
            text(`🌡️ Temp: ${temperatura.toFixed(1)}°C`, 20, 55);
            
            fill(qualidadeAr < 40 ? color(200, 0, 0) : color(0));
            text(`🍃 Ar: ${qualidadeAr.toFixed(0)}%`, 20, 80);
            
            fill(recursos < 20 ? color(200, 0, 0) : color(0));
            text(`💰 Recursos: ${Math.floor(recursos)}`, 20, 105);
            
            fill(0);
            text(`🌳 ${contadorArvores}/${metaArvores} (Nível ${nivel})`, 20, 130);
            
            let tempWidth = map(temperatura, 20, 50, 0, panelWidth - 40);
            fill(255, 0, 0, 150);
            rect(20, 145, tempWidth, 10, 5);
            
            stroke(0);
            strokeWeight(2);
            line(20 + map(20, 20, 50, 0, panelWidth - 40), 140, 
                 20 + map(20, 20, 50, 0, panelWidth - 40), 155);
            noStroke();
        }

        function atualizarJogo() {
            if (frameCount % 60 === 0) {
                tempo++;
                
                // Efeito de resfriamento das árvores
                let efeitoTotal = 0;
                for (let arvore of arvores) {
                    let tipo = TIPOS_ARVORES[0];
                    efeitoTotal += 0.005 * tipo.efeito * arvore.crescimento * (arvore.fertilidade / 100);
                }
                
                temperatura = Math.max(20, temperatura - efeitoTotal);
                qualidadeAr = Math.min(100, qualidadeAr + efeitoTotal * 200);
                
                // Geração de recursos
                if (tempo % 10 === 0) {
                    let recursosBase = 8;
                    let bonusArvores = 0;
                    for (let arvore of arvores) {
                        bonusArvores += 0.5 * (arvore.fertilidade / 100) * arvore.crescimento;
                    }
                    recursos += recursosBase + bonusArvores;
                }
                
                // Criação de poluição
                if (Math.random() < 0.01 + nivel * 0.003) {
                    criarPoluicao();
                }
            }
        }

        function verificarEstadoJogo() {
            // Verifica vitória (temperatura <= 20°)
            if (temperatura <= 20) {
                estadoJogo = 'vitoria';
                return;
            }
            
            // Verifica se completou o nível (atingiu a meta de árvores)
            if (contadorArvores >= metaArvores) {
                estadoJogo = 'proximo-nivel';
                return;
            }
            
            // Verifica derrota (temperatura >= 50° ou qualidade do ar <= 10)
            if (temperatura >= 50 || qualidadeAr <= 10) {
                estadoJogo = 'derrota';
                return;
            }
        }

        function criarPoluicao() {
            poluicao.push({
                x: Math.random() * width,
                y: Math.random() * -100 - 10,
                tamanho: Math.random() * 30 + 20,
                velocidade: (Math.random() * 0.7 + 0.3) * (1 + nivel * 0.1),
                opacidade: Math.random() * 100 + 100
            });
        }

        function mousePressed() {
            if (estadoJogo === 'derrota' || estadoJogo === 'vitoria') {
                reiniciarJogo();
                return;
            }
            
            if (estadoJogo === 'proximo-nivel') {
                avancarNivel();
                return;
            }
            
            if (celulaSelecionada && celulaSelecionada.disponivel && recursos >= 10) {
                plantarArvore(celulaSelecionada);
            }
        }

        function plantarArvore(celula) {
            let tipo = TIPOS_ARVORES[0];
            
            arvores.push({
                x: celula.x + TAMANHO_CELULA/2,
                y: celula.y + TAMANHO_CELULA,
                altura: Math.random() * (tipo.alturaMax - tipo.alturaMin) + tipo.alturaMin,
                crescimento: 0.1,
                fertilidade: celula.fertilidade,
                tipo: 0
            });
            
            celula.disponivel = false;
            recursos -= 10;
            contadorArvores++;
            totalArvoresPlantadas++;
            
            // Efeito imediato no clima
            temperatura = Math.max(20, temperatura - 0.4 * tipo.efeito);
            qualidadeAr = Math.min(100, qualidadeAr + 3 * tipo.efeito);
        }

        function avancarNivel() {
            nivel++;
            
            // Atualiza a meta para o próximo nível
            metaArvores = proximaMeta;
            proximaMeta = Math.floor(proximaMeta * 1.3); // Aumenta a meta em 30% para o próximo nível
            
            // Recompensa por completar o nível
            recursos += 30 + nivel * 10;
            
            // Não resetamos as árvores, apenas continuamos de onde paramos
            contadorArvores = 0; // Zera apenas o contador do nível atual
            
            // Aumenta a dificuldade gradualmente
            for (let i = 0; i < nivel; i++) {
                criarPoluicao();
            }
            
            // Ajusta o clima para ficar um pouco mais desafiador
            temperatura = Math.min(45, temperatura + nivel * 0.5);
            qualidadeAr = Math.max(30, qualidadeAr - nivel * 0.5);
            
            estadoJogo = 'jogando';
            mostrarMensagemNivel = 60; // Mostrar mensagem do novo nível
        }

        function reiniciarJogo() {
            arvores = [];
            poluicao = [];
            temperatura = 45;
            qualidadeAr = 50;
            recursos = 100;
            tempo = 0;
            estadoJogo = 'jogando';
            contadorArvores = 0;
            nivel = 1;
            metaArvores = 10;
            proximaMeta = 15;
            totalArvoresPlantadas = 0;
            
            for (let celula of terreno) {
                celula.disponivel = true;
                celula.fertilidade = Math.floor(Math.random() * 50) + 50;
            }
            
            for (let i = 0; i < 5; i++) {
                criarPoluicao();
            }
            
            mostrarMensagemNivel = 60;
        }

        function mostrarMensagemNivelCompleto() {
            fill(255, 230);
            rect(width/2 - 200, height/2 - 80, 400, 160, 20);
            fill(46, 139, 87);
            textSize(28);
            textStyle(BOLD);
            textAlign(CENTER, CENTER);
            text(`Nível ${nivel-1} Completo!`, width/2, height/2 - 50);
            
            textSize(20);
            text(`Próximo nível: ${nivel}`, width/2, height/2 - 15);
            
            textSize(16);
            text(`Nova meta: ${metaArvores} árvores`, width/2, height/2 + 15);
            text("Clique para continuar", width/2, height/2 + 50);
            
            textAlign(LEFT, BASELINE);
        }

        function mostrarMensagemFinal(msg, cor) {
            fill(255, 230);
            rect(width/2 - 200, height/2 - 60, 400, 120, 20);
            fill(cor);
            textSize(28);
            textStyle(BOLD);
            textAlign(CENTER, CENTER);
            text(msg, width/2, height/2 - 10);
            textSize(18);
            textStyle(NORMAL);
            text(`Árvores plantadas: ${totalArvoresPlantadas}`, width/2, height/2 + 15);
            text("Clique para jogar novamente", width/2, height/2 + 45);
            textAlign(LEFT, BASELINE);
        }

        function windowResized() {
            resizeCanvas(windowWidth, windowHeight);
            TAMANHO_CELULA = Math.min(40, windowWidth / 12);
            criarTerreno();
        }