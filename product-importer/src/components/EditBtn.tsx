import { useNavigate } from "react-router-dom";
export const EditBtn = ({ sku }: { sku: string }) => {
    const navigator = useNavigate();
    const handleClick = (): void => {
        alert('Edit button clicked');
        navigator(`/edit?sku=${sku}`);
    }
    return (
        <button id="editBtn" onClick={handleClick}>Edit</button>
    )
}
