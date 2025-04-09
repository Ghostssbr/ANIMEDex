export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { projectName, token } = req.body;

    try {
        const githubResponse = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                name: projectName,
                private: true,
                auto_init: true,
                description: 'Repositório criado automaticamente pelo AnimeDB'
            })
        });

        if (!githubResponse.ok) {
            const errorData = await githubResponse.json();
            return res.status(400).json({ 
                message: errorData.message || 'Erro no GitHub API' 
            });
        }

        const data = await githubResponse.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ 
            message: 'Internal server error' 
        });
    }
}
