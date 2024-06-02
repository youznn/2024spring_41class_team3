import Layout from '@/components/Layout';
import CodeEditor from '@/components/CodeEditor';
import Server_info from '@/components/Server_info';
import World_ranking from '@/components/World_ranking';
import Visualize_c from '@/components/Visualize_c';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import './MainPage.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaSpinner } from 'react-icons/fa';

const BASE_URL = process.env.REACT_APP_API_URL;

export default function MainPage() {
    const [inputCode, setInputCode] = useState(''); // input code
    const [outputCode, setOutputCode] = useState(''); // output code

    const [inputflag, setInputFlag] = useState(false);
    const [inputEmission, setInputEmission] = useState(0.0);
    const [outputEmission, setOutputEmission] = useState(0.0);
    const [loading, setLoading] = useState(false); // State to manage loading indicator

    const verifyGitHubUsername = async (username) => {
        try {
            const response = await axios.get(`https://api.github.com/users/${username}`);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    };

    const onSubmitButtonClick = async () => {
        if(!inputCode.trim()){
            Swal.fire('오류', '코드를 입력하세요.', 'error');
            return;
        }
        
        setLoading(true);
        const submitButton = document.getElementById('submitBtn');
        if (submitButton) {
            submitButton.disabled = true;
        }

        axios
            .post(`${BASE_URL}/code`, {
                code: inputCode,
                country: 'Korea', //TODO: FIX with dropdown
            })
            .then(async (res) => {
                setOutputCode(res.data.after_code);
                setInputEmission(res.data.before_carbon.toFixed(1));
                setOutputEmission(res.data.after_carbon.toFixed(1));

                const { value: makePublic } = await Swal.fire({
                    title: '게시판 공개',
                    text: "코드를 공개하시겠습니까?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: '네, 공개합니다!',
                    cancelButtonText: '아니오, 비공개입니다'
                });

                if (makePublic) {
                    const result = await Swal.fire({
                        title: 'GitHub ID를 입력하세요',
                        input: 'text',
                        inputPlaceholder: 'GitHub ID를 입력하세요',
                        showCancelButton: true,
                        cancelButtonText: '익명으로 올리겠습니다'
                    });

                    const githubId = result.isConfirmed && result.value ? result.value : null;
                    const anonymous =  !result.isConfirmed;

                    if (githubId) {
                        const isValidGitHubId = await verifyGitHubUsername(githubId);
                        if (!isValidGitHubId) {
                            await Swal.fire('오류', '유효한 GitHub ID가 아닙니다.', 'error');
                            setLoading(false);
                            return;
                        }
                    }

                    axios.post(`${BASE_URL}/sharing`, {
                        code_id: res.data.code_id,
                        anonymous,
                        github_id: githubId,
                    }).then((response) => {
                        if (response.data.success === 200) {
                            Swal.fire('성공', '코드가 성공적으로 게시되었습니다.', 'success');
                        } else {
                            Swal.fire('오류', '코드 게시 중 문제가 발생했습니다.', 'error');
                        }
                    }).catch((error) => {
                        console.error(error);
                        Swal.fire('오류', '코드 게시 중 문제가 발생했습니다.', 'error');
                    });
                }
            }).catch((error) => {
                console.error(error);
                Swal.fire('오류', '코드 제출 중 문제가 발생했습니다.', 'error');
            })
            .finally(() => {
				setInputFlag(true);
                setLoading(false);
                if (submitButton) {
                    submitButton.disabled = false;
                }
            });
    };

    return (
        <Layout>
            <div>
                <div className="flex flex-col gap-40">
                    <div className="flex h-96 justify-center gap-10 px-20">
                        <div className="flex flex-col gap-3">
                            <h1 className="text-xl font-bold text-lime-800">INPUT</h1>
                            <CodeEditor
                                value={inputCode}
                                onChange={(value) => setInputCode(value)}
                            />
                            <div className="flex">
                                <div className="flex-1" />
                                <Button
                                    id="submitBtn"
                                    onClick={onSubmitButtonClick}
                                    className="bg-lime-500 hover:bg-lime-600"
                                    disabled={loading} // Disable button when loading
                                >
                                    {loading ? (
                                        <FaSpinner className="animate-spin mr-2" />
                                    ) : (
                                        "submit"
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h1 className="text-xl font-bold text-lime-800">OUTPUT</h1>
                                <CodeEditor value={outputCode} readOnly />
                        </div>
                    </div>
                    <div className="flex h-[800px] justify-between gap-5">
                        <Server_info />
                        <Visualize_c
                            inputflag={inputflag}
                            inputEmission={inputEmission}
                            outputEmission={outputEmission}
                        />
                        <World_ranking />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
