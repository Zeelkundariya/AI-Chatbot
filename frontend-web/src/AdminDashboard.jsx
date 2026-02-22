import { useState, useEffect } from "react";

export default function AdminDashboard({ token, setToken }) {
    const [stats, setStats] = useState({ users: 0, chats: 0 });
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const authHeader = { "Authorization": `Bearer ${token}` };

            const [resStats, resUsers] = await Promise.all([
                fetch("http://localhost:8000/admin/analytics", { headers: authHeader }),
                fetch("http://localhost:8000/admin/users", { headers: authHeader })
            ]);

            const dStats = await resStats.json();
            const dUsers = await resUsers.json();

            setStats(dStats);
            setUsersList(dUsers);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch admin data", e);
        }
    };

    const blockUser = async (email) => {
        await fetch(`http://localhost:8000/admin/block/${email}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
        });
        fetchData();
    };

    const deleteUser = async (email) => {
        if (!window.confirm(`Delete ${email}?`)) return;
        await fetch(`http://localhost:8000/admin/delete/${email}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        fetchData();
    };

    if (loading) return <div className="container">Loading Dashboard...</div>;

    return (
        <div className="container">
            <nav>
                <h1 className="title">Study Bot Elite Admin</h1>
                <button onClick={() => setToken(null)}>Logout</button>
            </nav>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                    <h2 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase" }}>Total Users</h2>
                    <p style={{ fontSize: "2.5rem", fontWeight: "bold", margin: "0.5rem 0" }}>{stats.users}</p>
                </div>
                <div className="glass-card" style={{ padding: "1.5rem", textAlign: "center" }}>
                    <h2 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase" }}>Total Chats</h2>
                    <p style={{ fontSize: "2.5rem", fontWeight: "bold", margin: "0.5rem 0" }}>{stats.chats}</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: "1.5rem" }}>
                <h2 style={{ marginBottom: "1.5rem" }}>User Management</h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ textAlign: "left", borderBottom: "1px solid var(--glass-border)" }}>
                            <th style={{ padding: "1rem" }}>Email</th>
                            <th style={{ padding: "1rem" }}>Role</th>
                            <th style={{ padding: "1rem" }}>Status</th>
                            <th style={{ padding: "1rem" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersList.map((u) => (
                            <tr key={u.email} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                                <td style={{ padding: "1rem" }}>{u.email}</td>
                                <td style={{ padding: "1rem" }}>{u.role}</td>
                                <td style={{ padding: "1rem" }}>
                                    {u.blocked ?
                                        <span style={{ color: "#ef4444" }}>Blocked</span> :
                                        <span style={{ color: "#10b981" }}>Active</span>
                                    }
                                </td>
                                <td style={{ padding: "1rem" }}>
                                    {!u.blocked && (
                                        <button
                                            onClick={() => blockUser(u.email)}
                                            style={{ background: "#f59e0b", marginRight: "0.5rem", padding: "6px 12px", fontSize: "0.8rem" }}
                                        >
                                            Block
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteUser(u.email)}
                                        style={{ background: "#ef4444", padding: "6px 12px", fontSize: "0.8rem" }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
