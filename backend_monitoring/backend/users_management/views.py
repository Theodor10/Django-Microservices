from django.http.response import JsonResponse, HttpResponse
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .models import User
from .serializers import UserSerializer, LoginSerializer


class InvalidUser(Exception):
    pass


class UserView(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['updated']
    ordering = ['-updated']

    def get_queryset(self):
        if self.request.user.role == "admin":
            return User.objects.all()
        raise InvalidUser()

    def get_object(self):
        lookup_field_value = self.kwargs[self.lookup_field]
        obj = User.objects.get(id=lookup_field_value)
        self.check_object_permissions(self.request, obj)

        return obj


@api_view(['GET', 'POST'])
def manage_users(request):
    if request.method == 'GET':
        v = UserView.as_view({'get': 'list'})
        try:
            return v(request._request)
        except InvalidUser:
            return HttpResponse('401 Unauthorized', status=401)
    elif request.method == 'POST':
        v = UserView.as_view({'post': 'create'})
        return v(request._request)
    return JsonResponse({'message': 'Invalid method!'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def specific_user(request, pk):
    if request.method == 'GET':
        v = UserView.as_view({'get': 'retrieve'})
        return v(request._request, pk=pk)
    elif request.method == 'PUT':
        v = UserView.as_view({'put': 'partial_update'})
        return v(request._request, pk=pk)
    elif request.method == 'DELETE':
        v = UserView.as_view({'delete': 'destroy'})
        return v(request._request, pk=pk)
    return JsonResponse({'message': 'Invalid method!'}, status=status.HTTP_400_BAD_REQUEST)


class LoginViewSet(ModelViewSet, TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = (AllowAny,)
    http_method_names = ['post']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class RefreshViewSet(viewsets.ViewSet, TokenRefreshView):
    serializer_class = LoginSerializer
    permission_classes = (AllowAny,)
    http_method_names = ['post']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        return Response(serializer.validated_data, status=status.HTTP_200_OK)
