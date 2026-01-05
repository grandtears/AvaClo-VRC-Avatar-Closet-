

export function BaseItem(props: { active: boolean; label: string; onClick: () => void }) {
    const { active, label, onClick } = props;
    return (
        <button
            onClick={onClick}
            className={`sidebar-item ${active ? "active" : ""}`}
        >
            {label}
        </button>
    );
}
