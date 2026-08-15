import { AuthProvider }      from "./contexts/AuthContext";
import { ResumeProvider }    from "./contexts/ResumeContext";
import { InterviewProvider } from "./contexts/InterviewContext";
import AppRouter             from "./routes/AppRouter";

function App() {
  return (
    <AuthProvider>
      <ResumeProvider>
        <InterviewProvider>
          <AppRouter />
        </InterviewProvider>
      </ResumeProvider>
    </AuthProvider>
  );
}

export default App;
